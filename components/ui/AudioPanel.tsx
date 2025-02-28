"use client"
import { useRef, useEffect } from "react";
import { Mic, MicOff, Play, X, Volume2 } from "lucide-react";

interface AudioPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isRecording: boolean;
  isPlaying: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  speakResponse: (text: string) => void;
  lastResponse: string;
  userWaveform: number[];
  aiWaveform: number[];
  audioPlayerRef: React.RefObject<HTMLAudioElement | null>;
  error: string | null;
}

const AudioPanel: React.FC<AudioPanelProps> = ({
  isOpen,
  onClose,
  isRecording,
  isPlaying,
  startRecording,
  stopRecording,
  speakResponse,
  lastResponse,
  userWaveform,
  aiWaveform,
  audioPlayerRef,
  error
}) => {
  const canvasUserRef = useRef<HTMLCanvasElement>(null);
  const canvasAiRef = useRef<HTMLCanvasElement>(null);

  // Draw user's waveform
  useEffect(() => {
    if (canvasUserRef.current && userWaveform.length > 0) {
      const canvas = canvasUserRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#3b82f6"; // Blue color
        
        const barWidth = canvas.width / userWaveform.length;
        userWaveform.forEach((value, index) => {
          const height = value * canvas.height * 0.8;
          const x = index * barWidth;
          const y = (canvas.height - height) / 2;
          ctx.fillRect(x, y, barWidth - 1, height);
        });
      }
    }
  }, [userWaveform]);

  // Draw AI's waveform
  useEffect(() => {
    if (canvasAiRef.current && aiWaveform.length > 0) {
      const canvas = canvasAiRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#10b981"; // Green color
        
        const barWidth = canvas.width / aiWaveform.length;
        aiWaveform.forEach((value, index) => {
          const height = value * canvas.height * 0.8;
          const x = index * barWidth;
          const y = (canvas.height - height) / 2;
          ctx.fillRect(x, y, barWidth - 1, height);
        });
      }
    } else if (canvasAiRef.current && !isPlaying) {
      // Clear the canvas when not playing
      const canvas = canvasAiRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [aiWaveform, isPlaying]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-gray-900/80 backdrop-blur-lg shadow-lg p-6 z-50 overflow-y-auto transition-all duration-300 ease-in-out border-l border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">Voice Chat</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Your Voice</span>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-full ${
                isRecording 
                  ? "bg-red-600 text-white animate-pulse" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
          
          <div className="bg-gray-800/60 rounded-lg p-3 h-20 flex items-center justify-center">
            {userWaveform.length > 0 ? (
              <canvas 
                ref={canvasUserRef} 
                width={300} 
                height={80} 
                className="w-full h-full"
              />
            ) : (
              <span className="text-gray-500 text-sm">
                {isRecording ? "Recording..." : "Click the mic to start recording"}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">AI Voice</span>
            <button
              onClick={() => lastResponse && speakResponse(lastResponse)}
              disabled={isPlaying || !lastResponse}
              className={`p-2 rounded-full ${
                isPlaying 
                  ? "bg-green-600 text-white animate-pulse" 
                  : lastResponse
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isPlaying ? <Volume2 size={18} /> : <Play size={18} />}
            </button>
          </div>
          
          <div className="bg-gray-800/60 rounded-lg p-3 h-20 flex items-center justify-center">
            {aiWaveform.length > 0 ? (
              <canvas 
                ref={canvasAiRef} 
                width={300} 
                height={80} 
                className="w-full h-full"
              />
            ) : (
              <span className="text-gray-500 text-sm">
                {isPlaying ? "Playing..." : "AI response will play here"}
              </span>
            )}
          </div>
        </div>
      </div>

      <audio ref={audioPlayerRef} className="hidden" />
      
      <div className="mt-6 text-xs text-gray-400">
        <p>Click the microphone button to record your message. The AI will respond with text and voice.</p>
      </div>
    </div>
  );
};

export default AudioPanel;