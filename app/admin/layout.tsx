import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control OS | Marine Creatures',
  description: 'Private business operating system and operational control center for Marine Creatures.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="night" className="min-h-screen bg-[#02070B] text-[#F4F8FA]">
      {children}
    </div>
  );
}
