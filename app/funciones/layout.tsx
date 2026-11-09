import ResourcesLayout from '@/app/recursos/layout'
import ColorStripe from '@/components/brand/ColorStripe'

// Publication-ready routes; deploy previews retain the provider's noindex header.
export const metadata = { robots: { index: true, follow: true } }

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorStripe />
      <ResourcesLayout>{children}</ResourcesLayout>
    </>
  )
}
