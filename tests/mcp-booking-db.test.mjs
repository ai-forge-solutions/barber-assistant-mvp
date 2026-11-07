// Local disposable PostgreSQL only. Install embedded-postgres + pg outside the repo,
// then MCP_TEST_MODULES=/tmp/mcp-pg/node_modules node --test tests/mcp-booking-db.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const modules = process.env.MCP_TEST_MODULES
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const user = id(1), shop = id(2), barber = id(3), service = id(4)
const resource = 'https://example.test/mcp'

test('PostgreSQL real: propuesta persistente y confirmación atómica', { skip: !modules }, async t => {
  const migration = await readFile(new URL('../supabase/migrations/20261106184407_mcp_booking.sql', import.meta.url), 'utf8').catch(() => '')
  assert.ok(migration, 'Falta migración de reservas MCP')
  const require = createRequire(join(modules, '_test.cjs'))
  const { default: EmbeddedPostgres } = await import(require.resolve('embedded-postgres'))
  const pg = new EmbeddedPostgres({ databaseDir: join(tmpdir(), `mcp-booking-${process.pid}`), port: 55439, user: 'postgres', password: 'local-test-only', persistent: false, onLog() {}, onError() {} })
  let db
  try {
    await pg.initialise(); await pg.start()
    db = pg.getPgClient(); await db.connect()
    await db.query(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create table shops(id uuid primary key, name text, timezone text);
      create table barbers(id uuid primary key, shop_id uuid, display_name text, is_active boolean);
      create table services(id uuid primary key, shop_id uuid, name text, duration_min int, price numeric, is_active boolean);
      create table customers(id uuid primary key, full_name text, phone text);
      create table schedules(barber_id uuid, day_of_week int, start_time time, end_time time, break_start time, break_end time);
      create table blocked_slots(barber_id uuid, starts_at timestamptz, ends_at timestamptz);
      create table appointments(id uuid primary key default gen_random_uuid(), shop_id uuid, barber_id uuid, client_id uuid, service_id uuid, starts_at timestamptz, ends_at timestamptz, status text, reminder_sent boolean, created_at timestamptz default now());
      create table shop_subscriptions(shop_id uuid, status text, current_period_end timestamptz);
      create function shop_has_active_subscription(target_shop_id uuid) returns boolean language sql as $$ select exists(select 1 from shop_subscriptions where shop_id=target_shop_id and status in ('active','trialing') and (current_period_end is null or current_period_end>now())) $$;
      insert into shops values('${shop}','Test','Europe/Madrid');
      insert into barbers values('${barber}','${shop}','Barbero',true);
      insert into services values('${service}','${shop}','Corte',30,20,true);
      insert into customers values('${user}','Cliente','+34000000000');
      insert into shop_subscriptions values('${shop}','active',null);
      insert into schedules select '${barber}',n,'09:00','18:00','13:00','14:00' from generate_series(0,6)n;
    `)
    await t.test('preflight aborta atómicamente con solapamientos heredados, sin borrar citas', async () => {
      await db.query(`insert into appointments(barber_id,starts_at,ends_at,status) values
        ($1,'2028-06-01T08:00:00Z','2028-06-01T09:00:00Z','pending'),
        ($1,'2028-06-01T08:30:00Z','2028-06-01T09:30:00Z','pending')`,[barber])
      await assert.rejects(db.query(migration),/mcp_migration_existing_overlaps/)
      await db.query('rollback')
      assert.equal((await db.query('select count(*) from appointments')).rows[0].count,'2')
      assert.equal((await db.query("select to_regclass('public.mcp_booking_proposals') value")).rows[0].value,null)
      // Only fixtures inside this disposable PostgreSQL instance are removed.
      await db.query('delete from appointments')
    })
    await db.query(migration)
    // The lifecycle migration follows the deployed original, never rewrites it.
    const lifecycle = await readFile(new URL('../supabase/migrations/20261107130917_mcp_booking_lifecycle.sql', import.meta.url), 'utf8')
    const legacyProposal = (await db.query('select mcp_prepare_booking($1,$2,$3,$4,$5,$6) value',
      [user,resource,shop,barber,service,'2028-06-01T08:00:00Z'])).rows[0].value
    const legacyAppointment = (await db.query('select mcp_confirm_booking($1,$2,$3) value',
      [user,legacyProposal.proposalId,resource])).rows[0].value
    assert.equal(legacyAppointment.status,'pending','La migración original sigue intacta')
    const legacyBefore = (await db.query('select xmin::text version,to_jsonb(a) row from appointments a where id=$1',[legacyAppointment.id])).rows[0]
    await db.query(lifecycle)
    await t.test('migración aditiva y retry conservan citas MCP pending existentes sin backfill', async () => {
      assert.deepEqual((await db.query('select mcp_confirm_booking($1,$2,$3) value',
        [user,legacyProposal.proposalId,resource])).rows[0].value,legacyAppointment)
      assert.deepEqual((await db.query('select xmin::text version,to_jsonb(a) row from appointments a where id=$1',[legacyAppointment.id])).rows[0],legacyBefore)
    })
    // Remove only this disposable fixture so the original no-booking test stays isolated.
    await db.query('delete from mcp_booking_proposals where id=$1',[legacyProposal.proposalId])
    await db.query('delete from appointments where id=$1',[legacyAppointment.id])
    const prepare = async (start = '2028-07-12T08:00:00Z') => (await db.query('select mcp_prepare_booking($1,$2,$3,$4,$5,$6) value', [user,resource,shop,barber,service,start])).rows[0].value
    const confirm = async (proposal, client = db, who = user, audience = resource) => (await client.query('select mcp_confirm_booking($1,$2,$3) value', [who,proposal.proposalId,audience])).rows[0].value
    await t.test('preparar no crea cita; confirmar y repetir devuelve la misma sin datos sensibles', async () => {
      const p = await prepare()
      assert.equal(p.price,20)
      assert.equal((await db.query('select count(*) from appointments')).rows[0].count,'0')
      const a = await confirm(p), b = await confirm(p)
      assert.equal(a.status,'confirmed','Nuevas reservas MCP se confirman automáticamente')
      assert.equal(a.id,b.id); assert.equal(a.shop_id,shop)
      assert.equal(a.client_id,undefined)
      await db.query('update mcp_booking_proposals set expires_at=now()-interval \'1 hour\' where id=$1',[p.proposalId])
      assert.equal((await confirm(p)).id,a.id)
      await assert.rejects(confirm(p,db,id(9)), /proposal_not_found/)
      await assert.rejects(confirm(p,db,user,'https://other.test/mcp'), /proposal_not_found/)
    })
    await t.test('rechaza minutos fuera de la cuadrícula de duración del servicio', async () => {
      await assert.rejects(prepare('2028-07-13T08:07:00Z'), /outside_schedule/)
    })
    await t.test('cambios en los detalles mostrados requieren una nueva propuesta', async () => {
      const p = await prepare('2028-07-13T08:00:00Z')
      await db.query("update barbers set display_name='Nombre cambiado'")
      await assert.rejects(confirm(p), /changed_prepare_again/)
      await db.query("update barbers set display_name='Barbero'")
    })
    await t.test('cambios de zona horaria invalidan los detalles confirmados', async () => {
      const p = await prepare('2028-07-15T08:00:00Z')
      await db.query("update shops set timezone='Europe/Lisbon'")
      await assert.rejects(confirm(p), /changed_prepare_again/)
      await db.query("update shops set timezone='Europe/Madrid'")
    })
    await t.test('disponibilidad autoritativa usa zona local y no crea propuestas', async () => {
      const { rows } = await db.query('select mcp_booking_availability($1,$2,$3,$4,$5) value',[user,shop,barber,service,'2028-07-14'])
      const a = rows[0].value
      assert.equal(a.timezone,'Europe/Madrid')
      assert.equal(a.slots[0].startsAt,'2028-07-14T07:00:00+00:00')
      assert.equal(a.slots.length,16)
      assert.equal(a.slots.some(s => s.localStart.includes('13:00:00')),false)
    })
    await t.test('perfil incompleto, suscripción inactiva y selección cruzada se rechazan', async () => {
      await db.query("update customers set phone=' '")
      await assert.rejects(prepare('2028-07-16T08:00:00Z'),/profile_required/)
      await assert.rejects(db.query('select mcp_booking_availability($1,$2,$3,$4,$5)',[user,shop,barber,service,'2028-07-16']),/profile_required/)
      await db.query("update customers set phone='+34000000000'; update shop_subscriptions set status='past_due'")
      await assert.rejects(prepare('2028-07-16T08:00:00Z'),/subscription_required/)
      await db.query("update shop_subscriptions set status='active'; update barbers set is_active=false")
      await assert.rejects(prepare('2028-07-16T08:00:00Z'),/barber_unavailable/)
      await db.query("update barbers set is_active=true; update services set is_active=false")
      await assert.rejects(prepare('2028-07-16T08:00:00Z'),/service_unavailable/)
      await db.query("update services set is_active=true,shop_id=$1",[id(90)])
      await assert.rejects(prepare('2028-07-16T08:00:00Z'),/service_unavailable/)
      await db.query('update services set shop_id=$1;',[shop])
      await db.query('update barbers set shop_id=$1',[id(90)])
      await assert.rejects(prepare('2028-07-16T08:00:00Z'),/barber_unavailable/)
      await db.query('update barbers set shop_id=$1',[shop])
    })
    await t.test('caducidad, identidad y audiencia: no existen para otro principal', async () => {
      const p = await prepare('2028-07-17T08:00:00Z')
      await assert.rejects(confirm(p,db,id(99)),/proposal_not_found/)
      await assert.rejects(confirm(p,db,user,resource+'/other'),/proposal_not_found/)
      await db.query("update mcp_booking_proposals set expires_at=clock_timestamp()-interval '1 second' where id=$1",[p.proposalId])
      await assert.rejects(confirm(p),/proposal_expired/)
    })
    await t.test('horario, descanso, bloqueos solapados y fecha pasada se rechazan', async () => {
      await assert.rejects(prepare('2028-07-18T06:00:00Z'),/outside_schedule/)
      await assert.rejects(prepare('2028-07-18T11:00:00Z'),/outside_schedule/)
      await assert.rejects(prepare('2028-07-18T15:45:00Z'),/outside_schedule/)
      await assert.rejects(prepare('2020-01-01T08:00:00Z'),/invalid_time/)
      const p = await prepare('2028-07-18T08:00:00Z')
      await db.query('insert into blocked_slots values($1,$2,$3)',[barber,'2028-07-18T08:15:00Z','2028-07-18T09:00:00Z'])
      await assert.rejects(confirm(p),/slot_unavailable/)
      await assert.rejects(prepare('2028-07-18T08:00:00Z'),/slot_unavailable/)
      await db.query("update schedules set break_end=null")
      await assert.rejects(prepare('2028-07-19T08:00:00Z'),/outside_schedule/)
      await db.query("update schedules set break_end='14:00'")
    })
    await t.test('precio, duración, nombre y horario se revalidan al confirmar', async () => {
      const p = await prepare('2028-07-20T08:00:00Z')
      for (const edit of ["price=21","duration_min=60","name='Nuevo corte'"]) {
        await db.query('update services set '+edit)
        await assert.rejects(confirm(p),/changed_prepare_again/)
        await db.query("update services set price=20,duration_min=30,name='Corte'")
      }
      await db.query("update schedules set start_time='12:00'")
      await assert.rejects(confirm(p),/outside_schedule/)
      await db.query("update schedules set start_time='09:00'")
      await db.query("update shop_subscriptions set status='canceled'")
      await assert.rejects(confirm(p),/subscription_required/)
      await db.query("update shop_subscriptions set status='active'")
    })
    await t.test('DST SQL: hueco y doble hora, ambos offsets y cambio dentro del servicio', async () => {
      await db.query("update schedules set start_time='00:00',end_time='05:00',break_start=null,break_end=null")
      const unique = async wall => (await db.query("select mcp_unique_local_instant($1,'Europe/Madrid') instant",[wall])).rows[0].instant
      assert.equal(await unique('2028-03-26 02:30:00'),null)
      assert.equal(await unique('2028-10-29 02:30:00'),null)
      await assert.rejects(prepare('2028-10-29T02:30:00+02:00'),/local_time_invalid/)
      await assert.rejects(prepare('2028-10-29T02:30:00+01:00'),/local_time_invalid/)
      await assert.rejects(prepare('2028-03-26T01:30:00+01:00'),/local_time_invalid/)
      const availability = (await db.query('select mcp_booking_availability($1,$2,$3,$4,$5) value',[user,shop,barber,service,'2028-10-29'])).rows[0].value
      assert.equal(availability.slots.some(s=>s.localStart.slice(11,13)==='02'),false)
      await db.query("update schedules set start_time='09:00',end_time='18:00',break_start='13:00',break_end='14:00'")
    })
    await t.test('dos confirmaciones de propuestas distintas compiten: exactamente una cita', async () => {
      const a = await prepare('2028-07-21T08:00:00Z'), b = await prepare('2028-07-21T08:00:00Z')
      const other = pg.getPgClient(); await other.connect()
      try {
        const results = await Promise.allSettled([confirm(a),confirm(b,other)])
        assert.equal(results.filter(r=>r.status==='fulfilled').length,1)
        assert.match(results.find(r=>r.status==='rejected').reason.message,/slot_unavailable|exclusion/)
      } finally { await other.end() }
      assert.equal((await db.query('select count(*) from appointments where starts_at=$1',['2028-07-21T08:00:00Z'])).rows[0].count,'1')
    })
    await t.test('reintentos simultáneos de la misma propuesta devuelven la misma cita', async () => {
      const p = await prepare('2028-07-22T08:00:00Z')
      const other = pg.getPgClient(); await other.connect()
      try {
        const [a,b] = await Promise.all([confirm(p),confirm(p,other)])
        assert.equal(a.id,b.id)
      } finally { await other.end() }
    })
    await t.test('exclusión común web/MCP: carrera real y adyacencia permitida', async () => {
      const p = await prepare('2028-07-23T08:00:00Z')
      const other = pg.getPgClient(); await other.connect()
      const web = (client,start,end,status='pending') => client.query('insert into appointments(shop_id,barber_id,client_id,service_id,starts_at,ends_at,status) values($1,$2,$3,$4,$5,$6,$7)',[shop,barber,user,service,start,end,status])
      try {
        const results = await Promise.allSettled([confirm(p),web(other,'2028-07-23T08:00:00Z','2028-07-23T08:30:00Z')])
        assert.equal(results.filter(r=>r.status==='fulfilled').length,1)
        const rejection = results.find(r=>r.status==='rejected').reason
        assert.ok(rejection.code==='23P01' || /slot_unavailable/.test(rejection.message))
        await assert.rejects(web(other,'2028-07-23T08:15:00Z','2028-07-23T08:45:00Z'),e=>e.code==='23P01')
        await web(other,'2028-07-23T08:30:00Z','2028-07-23T09:00:00Z')
        await web(other,'2028-07-23T08:00:00Z','2028-07-23T08:30:00Z','cancelled')
        await assert.rejects(other.query("update appointments set status='pending' where status='cancelled'"),e=>e.code==='23P01')
      } finally { await other.end() }
    })
    await t.test('zona de sesión PostgreSQL no altera los instantes ni crea propuestas al consultar', async () => {
      const before = (await db.query('select count(*) from mcp_booking_proposals')).rows[0].count
      await db.query("set timezone='Pacific/Honolulu'")
      try {
        const a = (await db.query('select mcp_booking_availability($1,$2,$3,$4,$5) value',[user,shop,barber,service,'2028-07-24'])).rows[0].value
        assert.equal(new Date(a.slots[0].startsAt).toISOString(),'2028-07-24T07:00:00.000Z')
        assert.equal(a.slots[0].localStart,'2028-07-24T09:00:00')
        assert.equal((await db.query('select count(*) from mcp_booking_proposals')).rows[0].count,before)
      } finally { await db.query("set timezone='UTC'") }
    })
    await t.test('edición concurrente de horario bloquea y se revalida antes de crear cita', async () => {
      const p = await prepare('2028-07-25T08:00:00Z')
      const other = pg.getPgClient(); await other.connect()
      try {
        const pid = (await other.query('select pg_backend_pid() pid')).rows[0].pid
        await db.query("begin; update schedules set start_time='12:00'")
        const result = confirm(p,other).then(value=>({value}),error=>({error}))
        let blocked = false
        const deadline = Date.now()+5000
        while (Date.now()<deadline) {
          blocked = (await db.query('select cardinality(pg_blocking_pids($1))>0 blocked',[pid])).rows[0].blocked
          if (blocked) break
          await new Promise(resolve=>setTimeout(resolve,5))
        }
        await db.query('commit')
        const outcome = await result
        assert.equal(blocked,true,'La confirmación espera el lock de la edición')
        assert.match(outcome.error?.message ?? '',/outside_schedule/)
        assert.equal((await db.query('select count(*) from appointments where starts_at=$1',['2028-07-25T08:00:00Z'])).rows[0].count,'0')
      } finally {
        await db.query("rollback; update schedules set start_time='09:00'")
        await other.end()
      }
    })
    const cancel = async (appointment, client = db, who = user, audience = resource) =>
      (await client.query('select mcp_cancel_booking($1,$2,$3) value',[who,appointment,audience])).rows[0].value
    const webAppointment = async (n, status = 'pending', start = `2028-08-${String(n).padStart(2,'0')}T08:00:00Z`) => {
      const { rows } = await db.query(`insert into appointments(shop_id,barber_id,client_id,service_id,starts_at,ends_at,status)
        values($1,$2,$3,$4,$5,$5::timestamptz+interval '30 minutes',$6) returning id`,[shop,barber,user,service,start,status])
      return rows[0].id
    }
    await t.test('cancelación web propia es idempotente, sin borrado ni PII; libera slot compartido', async () => {
      const appointment = await webAppointment(1)
      await assert.rejects(prepare('2028-08-01T08:00:00Z'),/slot_unavailable/)
      const result = await cancel(appointment)
      assert.equal(result.id,appointment)
      assert.equal(result.status,'cancelled')
      assert.equal(result.shop_id,shop)
      assert.equal(result.barber_id,barber)
      assert.equal(result.service_id,service)
      assert.equal(new Date(result.starts_at).toISOString(),'2028-08-01T08:00:00.000Z')
      assert.equal(new Date(result.ends_at).toISOString(),'2028-08-01T08:30:00.000Z')
      assert.deepEqual(Object.keys(result).sort(),['id','shop_id','barber_id','service_id','starts_at','ends_at','status'].sort())
      const snapshot = (await db.query('select xmin::text version,to_jsonb(a) row from appointments a where id=$1',[appointment])).rows[0]
      assert.deepEqual(await cancel(appointment),result)
      assert.deepEqual((await db.query('select xmin::text version,to_jsonb(a) row from appointments a where id=$1',[appointment])).rows[0],snapshot)
      const replacementProposal = await prepare('2028-08-01T08:00:00Z')
      const replacement = await confirm(replacementProposal)
      assert.equal(replacement.status,'confirmed')
      assert.equal((await cancel(replacement.id)).status,'cancelled')
      const retry = await confirm(replacementProposal)
      assert.equal(retry.id,replacement.id)
      assert.equal(retry.status,'cancelled','Reconfirmar no resucita la cita cancelada')
    })
    await t.test('otro dueño y cita inexistente son indistinguibles; entradas nulas fallan cerradas', async () => {
      const appointment = await webAppointment(2,'confirmed')
      const failure = async action => {
        try { await action(); assert.fail('Debe rechazar') } catch (error) {
          assert.equal(error.message,'booking_appointment_not_found')
          return {code:error.code,message:error.message}
        }
      }
      assert.deepEqual(await failure(()=>cancel(appointment,db,id(99))),await failure(()=>cancel(id(9999))))
      await failure(()=>cancel(appointment,db,null))
      await failure(()=>cancel(null))
      for (const audience of [null,'',' ','not-a-resource','https://example.test/mcp\n','https://example.test/#fragment','x'.repeat(2049)]) {
        await assert.rejects(cancel(appointment,db,user,audience),/booking_resource_invalid/)
      }
      assert.equal((await db.query('select status from appointments where id=$1',[appointment])).rows[0].status,'confirmed')
    })
    await t.test('cancelar no depende de perfil, suscripción ni catálogo activos, tampoco de propuesta MCP', async () => {
      const appointment = await webAppointment(3,'confirmed')
      await db.query("update customers set full_name='',phone=''; update shop_subscriptions set status='past_due'; update barbers set is_active=false; update services set is_active=false")
      try {
        await db.query('set role service_role')
        assert.equal((await cancel(appointment)).status,'cancelled')
      } finally {
        await db.query("reset role; update customers set full_name='Cliente',phone='+340****0000'; update shop_subscriptions set status='active'; update barbers set is_active=true; update services set is_active=true")
      }
    })
    await t.test('completed, no_show, pasadas y estado nulo rechazan sin mutación; cancelled pasada admite retry', async () => {
      for (const [n,status,start] of [[4,'completed'],[5,'no_show'],[6,'pending','2020-08-06T08:00:00Z'],[7,'confirmed','2020-08-07T08:00:00Z'],[8,null]]) {
        const appointment = await webAppointment(n,status,start)
        const before = (await db.query('select xmin::text version,to_jsonb(a) row from appointments a where id=$1',[appointment])).rows[0]
        await assert.rejects(cancel(appointment),/booking_cancellation_not_allowed/)
        assert.deepEqual((await db.query('select xmin::text version,to_jsonb(a) row from appointments a where id=$1',[appointment])).rows[0],before)
      }
      const past = await webAppointment(9,'cancelled','2020-08-09T08:00:00Z')
      assert.equal((await cancel(past)).id,past)
      assert.equal((await cancel(past)).status,'cancelled')
    })
    await t.test('cancelación espera lock y revalida estado actualizado; reintentos concurrentes no reescriben', async () => {
      const appointment = await webAppointment(10,'confirmed')
      const other = pg.getPgClient(); await other.connect()
      try {
        const pid = (await other.query('select pg_backend_pid() pid')).rows[0].pid
        await db.query('begin')
        await db.query("update appointments set status='completed' where id=$1",[appointment])
        const pending = cancel(appointment,other).then(value=>({value}),error=>({error}))
        let blocked = false
        const deadline = Date.now()+5000
        while (Date.now()<deadline) {
          blocked = (await db.query('select cardinality(pg_blocking_pids($1))>0 blocked',[pid])).rows[0].blocked
          if (blocked) break
          await new Promise(resolve=>setTimeout(resolve,5))
        }
        await db.query('commit')
        const outcome = await pending
        assert.equal(blocked,true,'Cancelación debe esperar FOR UPDATE')
        assert.match(outcome.error?.message ?? '',/booking_cancellation_not_allowed/)
        const retry = await webAppointment(11,'confirmed')
        const results = await Promise.all([cancel(retry),cancel(retry,other)])
        assert.deepEqual(results[0],results[1])
        assert.equal(results[0].status,'cancelled')
        const version = (await db.query('select xmin::text version from appointments where id=$1',[retry])).rows[0].version
        await Promise.all([cancel(retry),cancel(retry,other)])
        assert.equal((await db.query('select xmin::text version from appointments where id=$1',[retry])).rows[0].version,version)
      } finally { await db.query('rollback'); await other.end() }
    })
    await t.test('roles públicos sin acceso a propuestas ni RPC; service_role sí', async () => {
      for (const signature of ['mcp_confirm_booking(uuid,uuid,text)','mcp_cancel_booking(uuid,uuid,text)']) {
        const fn = (await db.query('select prosecdef,proconfig from pg_proc where oid=$1::regprocedure',[signature])).rows[0]
        assert.equal(fn.prosecdef,true)
        assert.deepEqual(fn.proconfig,['search_path=pg_catalog, public'])
        assert.equal((await db.query(`select exists(select 1 from pg_proc p,
          lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
          where p.oid=$1::regprocedure and acl.grantee=0 and acl.privilege_type='EXECUTE') allowed`,[signature])).rows[0].allowed,false)
        for (const role of ['anon','authenticated','service_role']) {
          assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') allowed",[role,signature])).rows[0].allowed,role==='service_role')
        }
      }
      for (const role of ['anon','authenticated']) {
        await db.query('set role '+role)
        await assert.rejects(db.query('select * from mcp_booking_proposals'),e=>e.code==='42501')
        await assert.rejects(db.query('select mcp_confirm_booking($1,$2,$3)',[user,id(999),resource]),e=>e.code==='42501')
        await assert.rejects(db.query('select mcp_cancel_booking($1,$2,$3)',[user,id(999),resource]),e=>e.code==='42501')
        await db.query('reset role')
      }
      await db.query('set role service_role')
      assert.equal((await db.query('select count(*) from mcp_booking_proposals')).rows.length,1)
      await db.query('reset role')
    })
  } finally {
    if (db) await db.end()
    await pg.stop()
  }
})
