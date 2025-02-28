"use client";
import { useState, useRef, useEffect } from "react";
import { OpenAI } from "openai";
import { openaiConfig } from "./config.json";

const client = new OpenAI({
    baseURL: openaiConfig.OPENAI_BASE_URL,
    apiKey: openaiConfig.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});

export default function useAudio(sendMessage: (content: string) => Promise<void>) {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string>("");
    const [userWaveform, setUserWaveform] = useState<number[]>([]);
    const [aiWaveform, setAiWaveform] = useState<number[]>([]);
    const [lastResponse, setLastResponse] = useState<number>(0);
    const [audioError, setAudioError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const togglePanel = () => {
        setIsPanelOpen(!isPanelOpen);
    };

    const startRecording = async () => {
        setLastResponse(new Date().getTime());
        try {
            audioChunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioContextRef.current && analyserRef.current) {
                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                const updateWaveform = () => {
                    if (!isRecording) return;
                    analyserRef.current!.getByteFrequencyData(dataArray);
                    const normalizedData = Array.from(dataArray)
                        .slice(0, 50)
                        .map(val => val / 255);
                    setUserWaveform(normalizedData);
                    requestAnimationFrame(updateWaveform);
                };
                updateWaveform();
            }

            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await transcribeAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setAudioError(null);
        } catch (error) {
            console.error("Error starting recording:", error);
            setAudioError("Could not access microphone. Please check permissions.");
        }
        console.log(`Lasted ${new Date().getTime() - lastResponse}`);
        console.log(setLastResponse(0));
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setUserWaveform([]);
        }
    };

    const transcribeAudio = async (audioBlob: Blob) => {
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            formData.append('model', 'whisper-large-v3');

            const response = await client.audio.transcriptions.create({
                file: new File([audioBlob], 'recording.webm', { type: 'audio/webm' }),
                model: 'whisper-large-v3',
            });

            setTranscript(response.text);

            // Send the transcribed message to chat
            if (response.text.trim()) {
                await sendMessage(response.text);
            }
        } catch (error) {
            console.error("Error transcribing audio:", error);
            setAudioError("Failed to transcribe audio. Please try again.");
        }
    };

    const speechClient = new OpenAI({ baseURL: "https://indiecloud.co/v1", apiKey: "gsk-001", dangerouslyAllowBrowser: true });

    const speakResponse = async (text: string) => {
        try {
            const paragraphs = text.split('.').filter(p => p.trim() !== '').map(p => p.trim() + '.'); // Split into paragraphs

            for (const paragraph of paragraphs) {
                setIsPlaying(true);
                const response = await speechClient.audio.speech.create({
                    model: 'kokoro',
                    voice: 'nova',
                    input: paragraph,
                });
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                setLastResponse(0);

                if (!audioPlayerRef.current) {
                    audioPlayerRef.current = new Audio();
                } else {
                    audioPlayerRef.current.src = url;
                    await new Promise(resolve => {
                        audioPlayerRef.current.onended = resolve;
                        audioPlayerRef.current.play();
                        const previousWaveformRef = useRef<number[]>([]);

                        if (!audioPlayerRef.current.onplay) {
                            audioPlayerRef.current.onplay = () => {
                                if (audioContextRef.current && analyserRef.current) {
                                    const source = audioContextRef.current.createMediaElementSource(audioPlayerRef.current!);
                                    source.connect(analyserRef.current);
                                    analyserRef.current.connect(audioContextRef.current.destination);
                                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                                    const updateWaveform = () => {
                                        if (!isPlaying) return;
                                        analyserRef.current!.getByteFrequencyData(dataArray);
                                        const normalizedData = Array.from(dataArray)
                                            .slice(0, 50)
                                            .map(val => val / 255);

                                        if (JSON.stringify(normalizedData) !== JSON.stringify(previousWaveformRef.current)) {
                                            previousWaveformRef.current = normalizedData;
                                            setAiWaveform(normalizedData);
                                        }

                                        if (isPlaying) requestAnimationFrame(updateWaveform);
                                    };
                                    updateWaveform();
                                }
                            };
                        }
                    });
                }

                setIsPlaying(false);
                setAiWaveform([]);
            }
        } catch (error) {
            console.error("Error generating speech:", error);
            setAudioError("Failed to generate speech. Please try again.");
            setIsPlaying(false);
        }
    };

    useEffect(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.onended = () => {
                setIsPlaying(false);
                setAiWaveform([]);
            };
        }
    }, [isPlaying]);

    return {
        isRecording,
        isPlaying,
        isPanelOpen,
        transcript,
        audioUrl,
        userWaveform,
        aiWaveform,
        audioError,
        togglePanel,
        startRecording,
        stopRecording,
        speakResponse,
        audioPlayerRef,
    };
}