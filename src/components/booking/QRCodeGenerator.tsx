
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
}

export const QRCodeGenerator = ({ url }: QRCodeGeneratorProps) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'booking-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
        <img
          src={qrCodeUrl}
          alt="QR Code for booking link"
          className="w-48 h-48"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={downloadQRCode}
        className="w-full"
      >
        <Download className="w-4 h-4 mr-2" />
        Download QR Code
      </Button>
    </div>
  );
};
