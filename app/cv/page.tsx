import { redirect } from 'next/navigation'

export default function CVPage() {
	// Redirect server-side straight to the PDF in /public
	redirect('/cv_giacomo_maggiore.pdf')
}