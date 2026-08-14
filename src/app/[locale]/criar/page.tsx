import { Wizard } from '@/components/Wizard'
import { getDictionary, normalizeLocale } from '@/lib/i18n'

export default async function CreatePage({
  params,
}: PageProps<'/[locale]/criar'>) {
  const { locale } = await params
  return (
    <main className="flex flex-1 flex-col">
      <Wizard dict={getDictionary(locale)} locale={normalizeLocale(locale)} />
    </main>
  )
}
