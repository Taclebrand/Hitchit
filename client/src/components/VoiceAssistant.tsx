import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Brain,
  MapPin,
  Clock,
  Users,
  Sparkles
} from "lucide-react";

interface VoiceBookingIntent {
  action: 'book_ride' | 'create_trip' | 'cancel_booking' | 'get_status' | 'find_trips' | 'other';
  confidence: number;
  parameters: {
    pickup?: string;
    dropoff?: string;
    departureTime?: string;
    passengers?: number;
    vehiclePreference?: string;
    priceRange?: { min: number; max: number };
    tripId?: number;
    bookingId?: number;
  };
  clarificationNeeded: string[];
  suggestedResponse: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface BookingProgress {
  pickup?: string;
  dropoff?: string;
  departureTime?: string;
  passengers?: number;
  readyToBook: boolean;
}

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentIntent, setCurrentIntent] = useState<VoiceBookingIntent | null>(null);
  const [bookingProgress, setBookingProgress] = useState<BookingProgress>({
    readyToBook: false
  });
  const [suggestions, setSuggestions] = useState<{
    quickActions: string[];
    locationSuggestions: string[];
    timeSuggestions: string[];
    responses: string[];
  }>({
    quickActions: [],
    locationSuggestions: [],
    timeSuggestions: [],
    responses: []
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load conversation history from localStorage
    const savedHistory = localStorage.getItem('voiceAssistantHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setConversationHistory(parsed);
      } catch (error) {
        console.error('Failed to load conversation history:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save conversation history to localStorage
    localStorage.setItem('voiceAssistantHistory', JSON.stringify(conversationHistory));
  }, [conversationHistory]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);

      toast({
        title: "Listening...",
        description: "Speak your request clearly. Tap the microphone again to stop.",
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Microphone Access Failed",
        description: "Please allow microphone access to use voice commands.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert speech to text
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const transcriptResponse = await fetch('/api/ai/speech-to-text', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!transcriptResponse.ok) {
        throw new Error('Speech-to-text failed');
      }

      const { transcript } = await transcriptResponse.json();

      if (!transcript.trim()) {
        toast({
          title: "No Speech Detected",
          description: "Please try speaking more clearly.",
          variant: "destructive",
        });
        return;
      }

      // Add user message to conversation
      const userMessage: ConversationMessage = {
        role: 'user',
        content: transcript,
        timestamp: new Date()
      };

      setConversationHistory(prev => [...prev, userMessage]);

      // Process voice input to understand intent
      const intentResponse = await apiRequest('POST', '/api/ai/process-voice', {
        transcript,
        conversationHistory: conversationHistory.slice(-10), // Last 10 messages for context
        currentBookingSession: bookingProgress
      });

      setCurrentIntent(intentResponse);

      // Handle multi-turn conversation
      const conversationResponse = await apiRequest('POST', '/api/ai/conversation', {
        messages: [...conversationHistory, userMessage].slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      // Add assistant response to conversation
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: conversationResponse.response,
        timestamp: new Date()
      };

      setConversationHistory(prev => [...prev, assistantMessage]);
      setBookingProgress(conversationResponse.bookingProgress);

      // Generate suggestions for quick actions
      if (intentResponse.confidence > 0.5) {
        const suggestionsResponse = await apiRequest('POST', '/api/ai/voice-suggestions', {
          conversationHistory: conversationHistory.slice(-5),
          currentIntent: intentResponse
        });
        setSuggestions(suggestionsResponse);
      }

      // Play text-to-speech response
      await playTextToSpeech(conversationResponse.response);

      toast({
        title: "Voice Command Processed",
        description: `Understood: ${intentResponse.action} (${Math.round(intentResponse.confidence * 100)}% confidence)`,
      });

    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: "Voice Processing Failed",
        description: "Unable to process your voice command. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playTextToSpeech = async (text: string) => {
    try {
      const response = await fetch('/api/ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  };

  const handleQuickAction = async (action: string) => {
    const userMessage: ConversationMessage = {
      role: 'user',
      content: action,
      timestamp: new Date()
    };

    setConversationHistory(prev => [...prev, userMessage]);
    await processTextInput(action);
  };

  const processTextInput = async (text: string) => {
    setIsProcessing(true);

    try {
      const conversationResponse = await apiRequest('POST', '/api/ai/conversation', {
        messages: [...conversationHistory, { role: 'user', content: text }].slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: conversationResponse.response,
        timestamp: new Date()
      };

      setConversationHistory(prev => [...prev, assistantMessage]);
      setBookingProgress(conversationResponse.bookingProgress);

      await playTextToSpeech(conversationResponse.response);

    } catch (error) {
      console.error('Text processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Unable to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearConversation = () => {
    setConversationHistory([]);
    setCurrentIntent(null);
    setBookingProgress({ readyToBook: false });
    setSuggestions({ quickActions: [], locationSuggestions: [], timeSuggestions: [], responses: [] });
    localStorage.removeItem('voiceAssistantHistory');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'book_ride': return <Users className="h-4 w-4" />;
      case 'create_trip': return <MapPin className="h-4 w-4" />;
      case 'find_trips': return <MessageSquare className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span>AI Voice Assistant</span>
          </CardTitle>
          <CardDescription>
            Book rides, create trips, and manage your travel using natural voice commands
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              size="lg"
              className={`rounded-full h-16 w-16 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {isListening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
            
            <Button
              onClick={clearConversation}
              variant="outline"
              size="lg"
              className="rounded-full h-16 w-16"
            >
              <MessageSquare className="h-8 w-8" />
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            {isListening ? "Listening... Tap microphone to stop" :
             isProcessing ? "Processing your request..." :
             "Tap microphone to start voice command"}
          </div>

          {/* Current Intent Display */}
          {currentIntent && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getActionIcon(currentIntent.action)}
                    <span className="font-medium capitalize">
                      {currentIntent.action.replace('_', ' ')}
                    </span>
                  </div>
                  <Badge className={getConfidenceColor(currentIntent.confidence)}>
                    {Math.round(currentIntent.confidence * 100)}% confident
                  </Badge>
                </div>

                {Object.keys(currentIntent.parameters).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Extracted Information:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {currentIntent.parameters.pickup && (
                        <div><strong>Pickup:</strong> {currentIntent.parameters.pickup}</div>
                      )}
                      {currentIntent.parameters.dropoff && (
                        <div><strong>Dropoff:</strong> {currentIntent.parameters.dropoff}</div>
                      )}
                      {currentIntent.parameters.departureTime && (
                        <div><strong>Time:</strong> {currentIntent.parameters.departureTime}</div>
                      )}
                      {currentIntent.parameters.passengers && (
                        <div><strong>Passengers:</strong> {currentIntent.parameters.passengers}</div>
                      )}
                    </div>
                  </div>
                )}

                {currentIntent.clarificationNeeded.length > 0 && (
                  <Alert className="mt-3">
                    <AlertDescription>
                      <strong>Need clarification:</strong> {currentIntent.clarificationNeeded.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Booking Progress */}
          {(bookingProgress.pickup || bookingProgress.dropoff || bookingProgress.departureTime) && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Booking Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Pickup: {bookingProgress.pickup || "Not set"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Dropoff: {bookingProgress.dropoff || "Not set"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Time: {bookingProgress.departureTime || "Not set"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Passengers: {bookingProgress.passengers || "Not set"}</span>
                  </div>
                </div>

                {bookingProgress.readyToBook && (
                  <Alert>
                    <AlertDescription>
                      <strong>Ready to book!</strong> All required information has been collected.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {suggestions.quickActions.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Quick Actions:</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="text-sm"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Location and Time Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.locationSuggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Suggested Locations:</div>
                <div className="flex flex-wrap gap-1">
                  {suggestions.locationSuggestions.slice(0, 4).map((location, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {suggestions.timeSuggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Suggested Times:</div>
                <div className="flex flex-wrap gap-1">
                  {suggestions.timeSuggestions.slice(0, 4).map((time, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Conversation History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Conversation History</div>
              {conversationHistory.length > 0 && (
                <Button onClick={clearConversation} variant="outline" size="sm">
                  Clear History
                </Button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {conversationHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No conversation yet. Start by saying something like:
                  <br />
                  <em>"I need a ride to the airport tomorrow morning"</em>
                </div>
              ) : (
                conversationHistory.slice(-6).map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-100 ml-8' 
                        : 'bg-gray-100 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm">{message.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hidden audio element for TTS playback */}
          <audio ref={audioRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  );
}