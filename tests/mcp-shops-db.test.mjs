// Disposable local PostgreSQL only; never reads application/Supabase environment.
// MCP_TEST_MODULES=/tmp/mcp-pg/node_modules node --experimental-strip-types --test tests/mcp-shops-db.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createShopServices } from '../lib/mcp/shops.ts'

const modules = process.env.MCP_TEST_MODULES
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const alice = id(1), bob = id(2), newcomer = id(3)
const centro = id(10), norte = id(11), nueva = id(12), unknown = id(99)
const serviceCentro = id(20), serviceNorte = id(21), barberCentro = id(30), barberNorte = id(31)

// Small Supabase-shaped adapter, executing real SQL as service_role. No fake RPC
// results: both the migration and the unchanged production service are exercised.
function postgresAdapter(db) {
  const result = async action => {
    try { return { data: await action(), error: null } }
    catch (error) { return { data: null, error } }
  }
  return {
    rpc(name, args) {
      const functions = {
        mcp_known_shops: ['select * from public.mcp_known_shops($1)', [args.p_user_id]],
        mcp_my_appointments: ['select * from public.mcp_my_appointments($1,$2)', [args.p_user_id, args.p_shop_id]],
      }
      assert.ok(functions[name], `Unexpected RPC ${name}`)
      return result(async () => (await db.query(...functions[name])).rows)
    },
    from(table) {
      assert.ok(['shops', 'customer_shop_preferences'].includes(table))
      let columns, filter
      return {
        select(value) { columns = value; return this },
        eq(column, value) { filter = [column, value]; return this },
        maybeSingle() {
          assert.ok(['id', 'slug', 'user_id'].includes(filter[0]))
          assert.ok(['id,name,slug,address,timezone', 'preferred_shop_id'].includes(columns))
          return result(async () => (await db.query(`select ${columns} from public.${table} where ${filter[0]}=$1`, [filter[1]])).rows[0] ?? null)
        },
        upsert(row, options) {
          assert.equal(table, 'customer_shop_preferences')
          assert.equal(options.onConflict, 'user_id')
          return result(async () => {
            await db.query(`insert into public.customer_shop_preferences(user_id,preferred_shop_id,updated_at) values($1,$2,$3)
              on conflict(user_id) do update set preferred_shop_id=excluded.preferred_shop_id,updated_at=excluded.updated_at`, [row.user_id,row.preferred_shop_id,row.updated_at])
            return null
          })
        },
      }
    },
  }
}

test('PostgreSQL real: frontera cliente/multibarbería', { skip: !modules }, async t => {
  const require = createRequire(join(modules, '_test.cjs'))
  const { default: EmbeddedPostgres } = await import(require.resolve('embedded-postgres'))
  const directory = await mkdtemp(join(tmpdir(), 'mcp-shops-'))
  const pg = new EmbeddedPostgres({ databaseDir: join(directory, 'data'), port: 55441, user: 'postgres', password: 'local-test-only', persistent: false, onLog() {}, onError() {} })
  let db
  try {
    await pg.initialise(); await pg.start()
    db = pg.getPgClient(); await db.connect()
    await db.query(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, email text);
      create table public.customers(id uuid primary key references auth.users(id), full_name text, phone text);
      create table public.shops(id uuid primary key, name text not null, slug text unique not null, address text, timezone text not null);
      create table public.services(id uuid primary key, shop_id uuid references shops(id), name text, duration_min int, price numeric, is_active boolean);
      create table public.barbers(id uuid primary key, shop_id uuid references shops(id), display_name text, is_active boolean);
      create table public.appointments(id uuid primary key, client_id uuid references customers(id), shop_id uuid references shops(id),
        service_id uuid references services(id), barber_id uuid references barbers(id), starts_at timestamptz, ends_at timestamptz, status text,
        reminder_sent boolean default false, created_at timestamptz default now());
      alter table public.appointments enable row level security;
      grant select on public.shops to service_role;
      insert into auth.users values('${alice}','alice@example.test'),('${bob}','bob@example.test'),('${newcomer}','new@example.test');
      insert into customers values('${alice}','Alice fixture','secret-alice-phone'),('${bob}','Bob fixture','secret-bob-phone'),('${newcomer}','New fixture',null);
      insert into shops values('${centro}','Centro fixture','centro-fixture','Calle ficticia 1','Europe/Madrid'),
        ('${norte}','Norte fixture','norte-fixture','Calle ficticia 2','Atlantic/Canary'),('${nueva}','Nueva fixture','nueva-fixture',null,'Europe/Madrid');
      insert into services values('${serviceCentro}','${centro}','Corte centro',30,20,true),('${serviceNorte}','${norte}','Corte norte',45,25,true);
      insert into barbers values('${barberCentro}','${centro}','Profesional centro',true),('${barberNorte}','${norte}','Profesional norte',true);
      insert into appointments(id,client_id,shop_id,service_id,barber_id,starts_at,ends_at,status) values
        ('${id(100)}','${alice}','${centro}','${serviceCentro}','${barberCentro}','2028-01-03T10:00Z','2028-01-03T10:30Z','confirmed'),
        ('${id(101)}','${alice}',null,'${serviceNorte}','${barberNorte}','2028-01-02T10:00Z','2028-01-02T10:45Z','cancelled'),
        ('${id(102)}','${alice}',null,null,'${barberCentro}','2028-01-01T10:00Z','2028-01-01T10:30Z','completed'),
        ('${id(103)}','${bob}','${nueva}',null,null,'2028-01-04T10:00Z','2028-01-04T10:30Z','confirmed'),
        ('${id(104)}','${alice}',null,null,null,'2027-12-31T10:00Z','2027-12-31T10:30Z','cancelled');
    `)
    const historySnapshot = async () => (await db.query('select to_jsonb(a) row from public.appointments a order by id')).rows
    const before = await historySnapshot()
    const migration = await readFile(new URL('../supabase/migrations/20261106092000_customer_shop_preferences.sql', import.meta.url), 'utf8')
    await t.test('migración ejecuta y permite reaplicar sin backfill ni alterar citas', async () => {
      await db.query(migration)
      await db.query(migration)
      assert.deepEqual(await historySnapshot(), before)
      assert.equal((await db.query('select count(*) from customer_shop_preferences')).rows[0].count, '0')
      assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.customer_shop_preferences'::regclass")).rows[0].relrowsecurity, true)
    })
    await t.test('anon/authenticated no leen ni escriben preferencias ni ejecutan RPC', async () => {
      for (const role of ['anon', 'authenticated']) {
        await db.query(`set role ${role}`)
        try {
          for (const sql of [
            'select * from public.customer_shop_preferences',
            `insert into public.customer_shop_preferences(user_id) values('${alice}')`,
            `update public.customer_shop_preferences set preferred_shop_id='${centro}'`,
            'delete from public.customer_shop_preferences',
            `select * from public.mcp_known_shops('${alice}')`,
            `select * from public.mcp_my_appointments('${alice}',null)`,
          ]) await assert.rejects(db.query(sql), e => e.code === '42501')
        } finally { await db.query('reset role') }
      }
      for (const signature of ['public.mcp_known_shops(uuid)', 'public.mcp_my_appointments(uuid,uuid)']) {
        const { rows } = await db.query('select proconfig,prosecdef from pg_proc where oid=$1::regprocedure', [signature])
        assert.equal(rows[0].prosecdef, true)
        assert.ok(rows[0].proconfig.includes('search_path=public'))
      }
    })
    await db.query('set role service_role')
    const services = createShopServices(postgresAdapter(db))
    await t.test('historial jamás infiere preferencia; una sola barbería solo se sugiere', async () => {
      const a = await services.myShops(alice), b = await services.myShops(bob), n = await services.myShops(newcomer)
      assert.equal(a.selection, 'ask_customer'); assert.equal(a.preferred, null)
      assert.equal(b.selection, 'suggest_only_shop'); assert.equal(b.preferred, null)
      assert.equal(n.selection, 'ask_customer'); assert.deepEqual(n.known, [])
      assert.equal(a.historyIsAccessRestriction, false)
      assert.equal((await db.query('select count(*) from customer_shop_preferences')).rows[0].count, '0')
    })
    await t.test('legacy shop_id null se recupera por servicio o profesional; canceladas cuentan como historial', async () => {
      const context = await services.myShops(alice)
      assert.deepEqual(context.known.map(s => [s.id, s.booking_count]), [[centro, '2'], [norte, '1']])
      const appointments = (await services.myAppointments(alice)).appointments
      assert.equal(appointments.find(a => a.id === id(101)).shopId, norte)
      assert.equal(appointments.find(a => a.id === id(101)).status, 'cancelled')
      assert.equal(appointments.find(a => a.id === id(102)).shopId, centro)
      assert.equal(appointments.find(a => a.id === id(104)).shop, null)
      assert.equal(appointments.find(a => a.id === id(104)).shopId, null)
    })
    await t.test('dos clientes aislados en historial/citas/preferencia y proyección sin PII', async () => {
      await services.setPreferred(bob, nueva)
      const a = await services.myAppointments(alice), b = await services.myAppointments(bob)
      assert.deepEqual(b.appointments.map(a => a.id), [id(103)])
      assert.equal(a.appointments.some(a => a.id === id(103)), false)
      assert.deepEqual((await services.myShops(bob)).known.map(s => s.id), [nueva])
      assert.equal((await services.myShops(alice)).preferred, null)
      assert.equal((await services.myShops(bob)).preferred.id, nueva)
      for (const row of [...a.appointments, ...b.appointments]) {
        assert.deepEqual(Object.keys(row).sort(), ['barber','endsAt','id','service','shop','shopId','startsAt','status'])
        if (row.service) assert.deepEqual(Object.keys(row.service).sort(), ['durationMin','id','name','price'])
        if (row.barber) assert.deepEqual(Object.keys(row.barber).sort(), ['id','name'])
        if (row.shop) assert.deepEqual(Object.keys(row.shop).sort(), ['address','id','name','slug','timezone'])
      }
      assert.doesNotMatch(JSON.stringify([a,b]), /secret-|example\.test|client_id|reminder_sent/)
    })
    await t.test('preferencia explícita admite barbería fuera del historial sin reescribirlo y puede quitarse', async () => {
      const result = await services.setPreferred(alice, nueva)
      assert.equal(result.otherBarbershopsRemainAvailable, true)
      const context = await services.myShops(alice)
      assert.equal(context.selection, 'explicit_preference'); assert.equal(context.preferred.id, nueva)
      assert.deepEqual(context.known.map(s => s.id), [centro,norte])
      assert.equal((await services.myAppointments(alice, centro)).appointments.length, 2)
      await services.setPreferred(alice, null)
      assert.equal((await services.myShops(alice)).preferred, null)
      assert.equal((await services.myShops(bob)).preferred.id, nueva)
    })
    await t.test('barbería desconocida: resolución y preferencia fallan, filtro devuelve vacío', async () => {
      await assert.rejects(services.resolveShop('no-existe-fixture'), /Barbería no encontrada/)
      await assert.rejects(services.catalog(unknown), /Barbería no encontrada/)
      await assert.rejects(services.setPreferred(alice, unknown), /Barbería no encontrada/)
      await assert.rejects(db.query('insert into customer_shop_preferences(user_id,preferred_shop_id) values($1,$2) on conflict(user_id) do update set preferred_shop_id=excluded.preferred_shop_id', [alice,unknown]), e => e.code === '23503')
      assert.deepEqual((await services.myAppointments(alice, unknown)).appointments, [])
      const resolved = await services.resolveShop('nueva-fixture')
      assert.equal(resolved.shop.id, nueva); assert.equal(resolved.savedAsPreferred, false)
      assert.equal((await services.myShops(alice)).preferred, null)
    })
    await t.test('lecturas y preferencias no cambian historial; service_role puede borrar preferencia', async () => {
      await db.query('delete from customer_shop_preferences where user_id=$1', [alice])
      await db.query('reset role')
      assert.deepEqual(await historySnapshot(), before)
      await db.query('set role service_role')
    })
    await t.test('filtro opcional se aplica antes de LIMIT 201; respuesta limita a 200 con truncado correcto', async () => {
      await db.query('reset role')
      await db.query(`insert into appointments(id,client_id,shop_id,service_id,barber_id,starts_at,ends_at,status)
        select gen_random_uuid(),$1,$2,$3,$4,'2029-01-01T10:00Z'::timestamptz+n*interval '1 day','2029-01-01T10:30Z'::timestamptz+n*interval '1 day','confirmed'
        from generate_series(1,205) n`, [alice,centro,serviceCentro,barberCentro])
      await db.query('set role service_role')
      assert.equal((await db.query('select * from mcp_my_appointments($1,null)', [alice])).rowCount, 201)
      const all = await services.myAppointments(alice)
      assert.equal(all.appointments.length, 200); assert.equal(all.historyLimit, 200); assert.equal(all.truncated, true)
      const filtered = await services.myAppointments(alice, norte)
      assert.deepEqual(filtered.appointments.map(a => a.id), [id(101)])
      assert.equal(filtered.truncated, false)
      assert.equal((await services.myAppointments(bob)).appointments.length, 1)
      const known = await services.myShops(alice)
      assert.deepEqual(known.known.map(s => [s.id,s.booking_count]), [[centro,'207'],[norte,'1']])
    })
    await t.test('FK elimina preferencia al borrar usuario y anula tienda borrada sin inventar preferencia', async () => {
      await services.setPreferred(newcomer, nueva)
      await db.query('reset role')
      // Bob has an appointment in nueva, so use a disposable unbooked public shop.
      await db.query('insert into shops values($1,$2,$3,null,$4)', [id(13),'Temporal fixture','temporal-fixture','Europe/Madrid'])
      await db.query('set role service_role')
      await services.setPreferred(newcomer, id(13))
      await db.query('reset role')
      await db.query('delete from shops where id=$1', [id(13)])
      assert.equal((await db.query('select preferred_shop_id from customer_shop_preferences where user_id=$1', [newcomer])).rows[0].preferred_shop_id, null)
      await db.query('delete from customers where id=$1', [newcomer])
      await db.query('delete from auth.users where id=$1', [newcomer])
      assert.equal((await db.query('select * from customer_shop_preferences where user_id=$1', [newcomer])).rowCount, 0)
    })
  } finally {
    if (db) await db.end()
    try { await pg.stop() } finally { await rm(directory, { recursive: true, force: true }) }
  }
})
