import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AISettings,
  AIProvider,
  AVAILABLE_MODELS,
  getStoredAISettings,
  saveAISettings,
} from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Sparkles, Zap, Eye, EyeOff, ExternalLink, CheckCircle2 } from 'lucide-react';

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsSaved?: (settings: AISettings) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  open,
  onOpenChange,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<AISettings>(getStoredAISettings);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    saveAISettings(settings);
    if (onSettingsSaved) {
      onSettingsSaved(settings);
    }
    toast({
      title: 'Settings Saved',
      description: `Active AI Provider: ${
        settings.provider === 'gemini'
          ? 'Google Gemini'
          : settings.provider === 'groq'
          ? 'Groq'
          : 'Demo / Mock'
      }`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-alchemy-600" />
            <DialogTitle className="text-xl">AI Provider & API Keys</DialogTitle>
          </div>
          <DialogDescription>
            Choose your preferred AI engine for resume analysis. Keys are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Tabs
            value={settings.provider}
            onValueChange={(val) =>
              setSettings((prev) => ({ ...prev, provider: val as AIProvider }))
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="gemini" className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                Gemini
              </TabsTrigger>
              <TabsTrigger value="groq" className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Groq
              </TabsTrigger>
              <TabsTrigger value="mock" className="flex items-center gap-1.5">
                Demo (Free)
              </TabsTrigger>
            </TabsList>

            {/* Google Gemini Config */}
            <TabsContent value="gemini" className="space-y-4">
              <div className="rounded-md border p-3 bg-blue-50/50 text-xs text-blue-800 space-y-1">
                <p className="font-semibold flex items-center justify-between">
                  <span>Google Gemini API</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    Get Free API Key <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p>Generous free tier. Excellent for deep resume feedback and ATS evaluation.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <div className="relative">
                  <Input
                    id="gemini-key"
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={settings.geminiApiKey}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, geminiApiKey: e.target.value.trim() }))
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gemini-model">Model</Label>
                <Select
                  value={settings.geminiModel}
                  onValueChange={(val) =>
                    setSettings((prev) => ({ ...prev, geminiModel: val }))
                  }
                >
                  <SelectTrigger id="gemini-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.gemini.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Groq Config */}
            <TabsContent value="groq" className="space-y-4">
              <div className="rounded-md border p-3 bg-amber-50/50 text-xs text-amber-800 space-y-1">
                <p className="font-semibold flex items-center justify-between">
                  <span>Groq API</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-amber-700 hover:underline"
                  >
                    Get Groq Key <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p>Lightning-fast Llama-3.3 inference with instant structured JSON output.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groq-key">Groq API Key</Label>
                <div className="relative">
                  <Input
                    id="groq-key"
                    type={showGroqKey ? 'text' : 'password'}
                    placeholder="gsk_..."
                    value={settings.groqApiKey}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, groqApiKey: e.target.value.trim() }))
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showGroqKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groq-model">Model</Label>
                <Select
                  value={settings.groqModel}
                  onValueChange={(val) =>
                    setSettings((prev) => ({ ...prev, groqModel: val }))
                  }
                >
                  <SelectTrigger id="groq-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.groq.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Mock / Demo Mode */}
            <TabsContent value="mock" className="space-y-3">
              <div className="rounded-md border p-4 bg-gray-50 text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Demo Mode (Simulated AI)
                </div>
                <p className="text-xs">
                  Runs without any API keys or network requests. Generates mock feedback for demonstration and testing purposes.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-alchemy-600 hover:bg-alchemy-700 text-white">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
