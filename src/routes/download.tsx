import { createFileRoute } from '@tanstack/react-router';
import { Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/download')({
  component: DownloadPage,
});

function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
          <Smartphone className="h-12 w-12 text-white" />
        </div>
        
        <h1 className="mb-2 text-3xl font-bold">Creator Connect Hub</h1>
        <p className="mb-8 text-lg text-gray-400">Connect. Create. Grow.</p>
        
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-xl">
          <div className="mb-6 space-y-2">
            <h2 className="text-xl font-semibold">Android App</h2>
            <p className="text-sm text-gray-400">
              Download and install Creator Connect on your Android phone to get the full native experience.
            </p>
          </div>
          
          <Button 
            className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 py-6 text-lg font-bold hover:from-indigo-500 hover:to-pink-500"
            asChild
          >
            <a href="/downloads/creator-connect.apk" download>
              <Download className="mr-2 h-5 w-5" />
              Download Android App
            </a>
          </Button>
          
          <p className="mt-4 text-xs text-gray-500">
            If you are on a desktop, open this page on your Android phone to install the app.
          </p>
        </div>
      </div>
    </div>
  );
}
