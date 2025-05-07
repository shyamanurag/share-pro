import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Copy, Check, Share2, X } from 'lucide-react';
import { Stock } from '@/types/trading';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
}

export default function ShareModal({ isOpen, onClose, stock }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (stock && isOpen) {
      // Create the share URL with stock information
      const baseUrl = window.location.origin;
      const shareParams = new URLSearchParams({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.currentPrice.toString(),
        change: stock.change.toString(),
        changePercent: stock.changePercent.toString()
      });
      
      setShareUrl(`${baseUrl}/share?${shareParams.toString()}`);
    }
  }, [stock, isOpen]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy to clipboard",
      });
    }
  };

  const shareViaNavigator = async () => {
    if (!navigator.share) {
      toast({
        variant: "destructive",
        title: "Sharing not supported",
        description: "Web Share API is not supported in your browser",
      });
      return;
    }

    try {
      await navigator.share({
        title: `${stock?.symbol} - Stock Information`,
        text: `Check out ${stock?.name} (${stock?.symbol}) trading at ₹${stock?.currentPrice.toFixed(2)}`,
        url: shareUrl,
      });
      
      toast({
        title: "Shared successfully!",
        description: "Stock information has been shared",
      });
    } catch (err) {
      console.error('Error sharing:', err);
      // User might have cancelled the share operation, so we don't show an error toast
    }
  };

  if (!stock) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Share {stock.symbol}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Share this stock information with friends and colleagues
          </p>
          
          <div className="flex items-center space-x-2">
            <Input 
              value={shareUrl} 
              readOnly 
              className="flex-1"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={copyToClipboard}
              className="flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button 
            onClick={shareViaNavigator} 
            className="flex-1 sm:flex-none"
            disabled={!navigator.share}
          >
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}