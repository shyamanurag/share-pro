import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Copy,
  Share2,
  Twitter,
  Facebook,
  Mail,
  Linkedin,
  WhatsApp,
  Check,
  Link
} from 'lucide-react';
import { Stock } from '@/types/trading';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
}

export default function ShareModal({ isOpen, onClose, stock }: ShareModalProps) {
  const [personalMessage, setPersonalMessage] = useState('');
  const [activeTab, setActiveTab] = useState('link');
  const [copied, setCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  if (!stock) return null;

  const generateShareLink = () => {
    // In a real app, this would generate a unique URL with the stock info
    // For now, we'll create a simulated link with query parameters
    const baseUrl = window.location.origin;
    const stockParams = encodeURIComponent(JSON.stringify({
      symbol: stock.symbol,
      name: stock.name,
      price: stock.currentPrice,
      change: stock.change,
      changePercent: stock.changePercent
    }));
    
    return `${baseUrl}/share?stock=${stockParams}&msg=${encodeURIComponent(personalMessage)}`;
  };

  const copyToClipboard = () => {
    if (linkInputRef.current) {
      linkInputRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaEmail = () => {
    const subject = `Check out ${stock.symbol} stock on TradePaper`;
    const body = `${personalMessage ? personalMessage + '\n\n' : ''}${stock.name} (${stock.symbol}) is currently trading at ₹${stock.currentPrice.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%).\n\nCheck it out: ${generateShareLink()}`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaSocialMedia = (platform: string) => {
    const shareText = `${personalMessage ? personalMessage + ' ' : ''}Check out ${stock.symbol} stock on TradePaper! Currently at ₹${stock.currentPrice.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)`;
    const shareUrl = generateShareLink();
    
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-6">
                <DialogHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        {stock.symbol}
                        <Badge variant="outline" className="ml-2">
                          NSE
                        </Badge>
                      </DialogTitle>
                      <DialogDescription className="mt-1">
                        {stock.name}
                      </DialogDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold flex items-center justify-end">
                        <IndianRupee className="w-4 h-4 mr-0.5" />
                        {stock.currentPrice.toFixed(2)}
                      </div>
                      <div className={`flex items-center justify-end text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stock.change >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        <span>
                          {stock.change >= 0 ? '+' : ''}
                          {stock.change.toFixed(2)} ({stock.change >= 0 ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="mt-4">
                  <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-2">
                      <TabsTrigger value="link">
                        <Link className="h-4 w-4 mr-2" />
                        Copy Link
                      </TabsTrigger>
                      <TabsTrigger value="social">
                        <Share2 className="h-4 w-4 mr-2" />
                        Social Media
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="link" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Add a personal message (optional)</label>
                        <Textarea
                          placeholder="Check out this stock I found..."
                          value={personalMessage}
                          onChange={(e) => setPersonalMessage(e.target.value)}
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Share link</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            ref={linkInputRef}
                            value={generateShareLink()}
                            readOnly
                            className="flex-1"
                          />
                          <Button 
                            size="icon" 
                            onClick={copyToClipboard}
                            className={copied ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="social" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Add a personal message (optional)</label>
                        <Textarea
                          placeholder="Check out this stock I found..."
                          value={personalMessage}
                          onChange={(e) => setPersonalMessage(e.target.value)}
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          className="flex items-center justify-center gap-2 py-6"
                          onClick={() => shareViaSocialMedia('twitter')}
                        >
                          <Twitter className="h-5 w-5 text-blue-400" />
                          <span>Twitter</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex items-center justify-center gap-2 py-6"
                          onClick={() => shareViaSocialMedia('facebook')}
                        >
                          <Facebook className="h-5 w-5 text-blue-600" />
                          <span>Facebook</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex items-center justify-center gap-2 py-6"
                          onClick={() => shareViaSocialMedia('whatsapp')}
                        >
                          <WhatsApp className="h-5 w-5 text-green-500" />
                          <span>WhatsApp</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex items-center justify-center gap-2 py-6"
                          onClick={() => shareViaSocialMedia('linkedin')}
                        >
                          <Linkedin className="h-5 w-5 text-blue-700" />
                          <span>LinkedIn</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex items-center justify-center gap-2 py-6 col-span-2"
                          onClick={shareViaEmail}
                        >
                          <Mail className="h-5 w-5 text-gray-500" />
                          <span>Email</span>
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <DialogFooter className="mt-6 flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  {activeTab === 'link' ? (
                    <Button 
                      onClick={copyToClipboard}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" /> 
                      Copy Link
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => shareViaEmail()}
                      className="flex-1"
                    >
                      <Share2 className="w-4 h-4 mr-2" /> 
                      Share
                    </Button>
                  )}
                </DialogFooter>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}