
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Copy, QrCode, ExternalLink, Share2 } from 'lucide-react';
import { QRCodeGenerator } from '@/components/booking/QRCodeGenerator';
import { BookingLinkPreview } from '@/components/booking/BookingLinkPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const BookingLinkManager = () => {
  const { toast } = useToast();
  const [businessSlug, setBusinessSlug] = useState('elite-hair-salon');
  const [isEnabled, setIsEnabled] = useState(true);
  const [requireLogin, setRequireLogin] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const baseUrl = window.location.origin;
  const bookingLink = `${baseUrl}/book/${businessSlug}`;
  const shortLink = `${baseUrl}/b/${businessSlug}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "The booking link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please select and copy the link manually.",
        variant: "destructive"
      });
    }
  };

  const shareOnPlatform = (platform: string) => {
    const text = `Book an appointment with us: ${bookingLink}`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(bookingLink);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'sms':
        shareUrl = `sms:?body=${encodedText}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Book an appointment')}&body=${encodedText}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const testBookingLink = () => {
    window.open(bookingLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Link Manager</h1>
          <p className="text-gray-600 mt-2">Create and manage your business booking link to share with customers</p>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Link Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">247</div>
                  <div className="text-sm text-gray-600">Total Visits</div>
                  <div className="text-xs text-gray-500">Last 30 days</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">89</div>
                  <div className="text-sm text-gray-600">Completed Bookings</div>
                  <div className="text-xs text-gray-500">From this link</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">36%</div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                  <div className="text-xs text-gray-500">Visits to bookings</div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Pro Tip</h4>
                <p className="text-sm text-blue-800">
                  Share your booking link on your website, social media, and business cards. 
                  The QR code works great for physical locations!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Link Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Link Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="businessSlug">Business Slug</Label>
                <div className="flex space-x-2">
                  <span className="flex items-center px-3 py-2 border border-input rounded-l-md bg-muted text-sm">
                    {baseUrl}/book/
                  </span>
                  <Input
                    id="businessSlug"
                    value={businessSlug}
                    onChange={(e) => setBusinessSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="rounded-l-none"
                    placeholder="my-business"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Only lowercase letters, numbers, and hyphens are allowed
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enabled">Enable Booking Link</Label>
                    <p className="text-sm text-gray-500">Allow customers to book through this link</p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={isEnabled}
                    onCheckedChange={setIsEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireLogin">Require Login Before Booking</Label>
                    <p className="text-sm text-gray-500">Customers must create an account first</p>
                  </div>
                  <Switch
                    id="requireLogin"
                    checked={requireLogin}
                    onCheckedChange={setRequireLogin}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Links */}
          <Card>
            <CardHeader>
              <CardTitle>Your Booking Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Booking Link</Label>
                <div className="flex space-x-2">
                  <Input value={bookingLink} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(bookingLink)}
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testBookingLink}
                    title="Test booking link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* QR Code and Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>Share Your Booking Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium">QR Code</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Share this QR code for easy mobile access
                  </p>
                  <QRCodeGenerator url={bookingLink} />
                </div>

                <div>
                  <Label className="text-base font-medium">Share On Social Media</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Share your booking link across platforms
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareOnPlatform('whatsapp')}
                      className="justify-start"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share on WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareOnPlatform('facebook')}
                      className="justify-start"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share on Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareOnPlatform('twitter')}
                      className="justify-start"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share on Twitter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareOnPlatform('email')}
                      className="justify-start"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share via Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareOnPlatform('sms')}
                      className="justify-start"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share via SMS
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
};

export default BookingLinkManager;
