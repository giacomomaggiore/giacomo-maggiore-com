import { redirect } from 'next/navigation'

export default function CVPage() {
	// Redirect server-side direttamente al PDF nella cartella public
	redirect('/cv_giacomo_maggiore.pdf')
}