import ResourcesLayout from '@/app/recursos/layout'
import ColorStripe from '@/components/brand/ColorStripe'

// Every new feature route is an editorial preview until explicitly approved.
export const metadata = { robots: { index: false, follow: false } }

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorStripe />
      <ResourcesLayout>{children}</ResourcesLayout>
    </>
  )
}
