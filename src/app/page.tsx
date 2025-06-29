
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect the root path to the default mode
  redirect('/direct');
  return null;
}
