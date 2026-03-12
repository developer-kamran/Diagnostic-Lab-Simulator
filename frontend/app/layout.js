import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata = {
  title: 'DL Simulator — Dr. Essa Laboratory',
  description: 'Queue modeling and simulation for diagnostic laboratories',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="layout-container">
          <Sidebar />
          <div className="main-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
