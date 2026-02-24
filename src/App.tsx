/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ChevronLeft, ChevronRight, BarChart2, Home, Settings, Music, Volume2, VolumeX, Info, X, User, Users, ClipboardList, Calendar } from 'lucide-react';

// --- Types ---
interface TestResult {
  id: number;
  test_type: string;
  result_data: string;
  created_at: string;
}

interface Patient {
  id: number;
  name: string;
  age: number;
  sex: string;
  created_at: string;
  results?: TestResult[];
}

// --- Audio Helper ---
const playSound = (type: 'click' | 'hover' | 'back' | 'success') => {
  const sounds: Record<string, string> = {
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Pop/Click
    hover: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Soft tick
    back: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // Slide
    success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Chime
  };
  const audio = new Audio(sounds[type]);
  audio.volume = 0.4;
  audio.play().catch(() => {}); // Ignore autoplay blocks
};

// --- Components ---

const WiiButton = ({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary",
  disabled = false 
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string,
  variant?: "primary" | "secondary" | "danger",
  disabled?: boolean
}) => {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onMouseEnter={() => !disabled && playSound('hover')}
      onClick={() => {
        if (!disabled) {
          playSound('click');
          onClick?.();
        }
      }}
      disabled={disabled}
      className={`wii-button ${variant === 'danger' ? 'text-red-500' : 'text-wii-blue'} ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </motion.button>
  );
};

// --- Bouncing Bubbles Component ---
const BouncingBubbles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let bubbles: Bubble[] = [];

    class Bubble {
      x: number;
      y: number;
      radius: number;
      dx: number;
      dy: number;
      color: string;
      thickness: number;

      constructor(x: number, y: number, radius: number, dx: number, dy: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.dx = dx;
        this.dy = dy;
        this.color = '#00a0e9'; // wii-blue
        this.thickness = 8;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.lineWidth = this.thickness;
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.closePath();
      }

      update() {
        if (this.x + this.radius > canvas!.width || this.x - this.radius < 0) {
          this.dx = -this.dx;
        }
        if (this.y + this.radius > canvas!.height || this.y - this.radius < 0) {
          this.dy = -this.dy;
        }

        this.x += this.dx;
        this.y += this.dy;

        // Collision detection with other bubbles
        for (let i = 0; i < bubbles.length; i++) {
          if (this === bubbles[i]) continue;
          const dist = Math.hypot(this.x - bubbles[i].x, this.y - bubbles[i].y);
          if (dist < this.radius + bubbles[i].radius) {
            // Simple elastic collision (swap velocities)
            const tempDx = this.dx;
            const tempDy = this.dy;
            this.dx = bubbles[i].dx;
            this.dy = bubbles[i].dy;
            bubbles[i].dx = tempDx;
            bubbles[i].dy = tempDy;

            // Prevent sticking
            const overlap = this.radius + bubbles[i].radius - dist;
            const angle = Math.atan2(this.y - bubbles[i].y, this.x - bubbles[i].x);
            this.x += Math.cos(angle) * overlap / 2;
            this.y += Math.sin(angle) * overlap / 2;
            bubbles[i].x -= Math.cos(angle) * overlap / 2;
            bubbles[i].y -= Math.sin(angle) * overlap / 2;
          }
        }

        this.draw();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      bubbles = [];
      for (let i = 0; i < 8; i++) {
        const radius = Math.random() * 40 + 40;
        const x = Math.random() * (canvas.width - radius * 2) + radius;
        const y = Math.random() * (canvas.height - radius * 2) + radius;
        const dx = (Math.random() - 0.5) * 2;
        const dy = (Math.random() - 0.5) * 2;
        bubbles.push(new Bubble(x, y, radius, dx, dy));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bubbles.forEach(bubble => bubble.update());
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-20"
    />
  );
};

export default function App() {
  const [view, setView] = useState<'start' | 'dashboard' | 'questionnaire' | 'result' | 'glasgow' | 'glasgowResult' | 'patientSelection' | 'patientRegistration' | 'patientHistory'>('start');
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Patient state
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ name: '', age: '', sex: 'M' });

  // Questionnaire state
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    relatives: 2, // 2 or 3
    ageGroup: 0, // 0: 20-29, 1: 30-39, 2: 40-49, 3: 50-59, 4: 60-69
    smoking: false,
    hypertension: false
  });
  const [riskResult, setRiskResult] = useState<number | null>(null);

  // Glasgow state
  const [gcsStep, setGcsStep] = useState(0);
  const [gcsAnswers, setGcsAnswers] = useState({
    eye: 0,
    verbal: 0,
    motor: 0
  });
  const [gcsTotal, setGcsTotal] = useState<number | null>(null);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      setPatientsList(data);
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/patients/${id}`);
      const data = await res.json();
      setCurrentPatient(data);
    } catch (err) {
      console.error("Error fetching patient details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createPatient = async () => {
    if (!newPatientForm.name || !newPatientForm.age) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPatientForm.name,
          age: parseInt(newPatientForm.age),
          sex: newPatientForm.sex
        })
      });
      const data = await res.json();
      setCurrentPatient(data);
      setView('dashboard');
      playSound('success');
    } catch (err) {
      console.error("Error creating patient:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveResult = async (testType: string, data: any) => {
    if (!currentPatient) return;
    try {
      await fetch(`/api/patients/${currentPatient.id}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_type: testType,
          result_data: data
        })
      });
      // Refresh patient details to get updated results
      fetchPatientDetails(currentPatient.id);
    } catch (err) {
      console.error("Error saving result:", err);
    }
  };

  const riskData = {
    relatives2: {
      noHypertension: {
        nonSmoker: [5, 6, 7, 8, 9],
        smoker: [9, 10, 12, 13, 15]
      },
      hypertension: {
        nonSmoker: [6, 7, 8, 9, 10],
        smoker: [10, 12, 14, 15, 17]
      }
    },
    relatives3: {
      noHypertension: {
        nonSmoker: [5, 8, 12, 17, 26],
        smoker: [9, 13, 20, 29, 36]
      },
      hypertension: {
        nonSmoker: [6, 9, 13, 20, 29],
        smoker: [10, 15, 23, 36, 36]
      }
    }
  };

  const calculateRisk = () => {
    const relKey = answers.relatives === 2 ? 'relatives2' : 'relatives3';
    const hypKey = answers.hypertension ? 'hypertension' : 'noHypertension';
    const smokeKey = answers.smoking ? 'smoker' : 'nonSmoker';
    const risk = riskData[relKey][hypKey][smokeKey][answers.ageGroup];
    setRiskResult(risk);
    setView('result');
    playSound('success');
    
    if (currentPatient) {
      saveResult('NASH', { risk, answers });
    }
  };

  const renderGlasgow = () => {
    const gcsQuestions = [
      {
        title: "Apertura Ocular (E)",
        options: [
          { label: "Espontánea", value: 4 },
          { label: "Al estímulo verbal", value: 3 },
          { label: "Al dolor", value: 2 },
          { label: "Ausente", value: 1 }
        ],
        key: 'eye'
      },
      {
        title: "Respuesta Verbal (V)",
        options: [
          { label: "Orientado", value: 5 },
          { label: "Confuso", value: 4 },
          { label: "Palabras inapropiadas", value: 3 },
          { label: "Sonidos incomprensibles", value: 2 },
          { label: "Ausente", value: 1 }
        ],
        key: 'verbal'
      },
      {
        title: "Respuesta Motora (M)",
        options: [
          { label: "Obedece órdenes", value: 6 },
          { label: "Localiza el dolor", value: 5 },
          { label: "Retirada al dolor", value: 4 },
          { label: "Flexión anormal (decorticación)", value: 3 },
          { label: "Extensión anormal (descerebración)", value: 2 },
          { label: "Ausente", value: 1 }
        ],
        key: 'motor'
      }
    ];

    const currentQuestion = gcsQuestions[gcsStep];

    return (
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="flex flex-col items-center justify-center min-h-[70vh] p-8 max-w-2xl mx-auto w-full"
      >
        <div className="wii-card p-10 w-full space-y-8">
          <div className="space-y-2">
            <p className="text-wii-blue font-bold uppercase tracking-widest text-xs">Escala de Glasgow - {gcsStep + 1} de 3</p>
            <h2 className="text-2xl md:text-3xl font-bold text-wii-dark-gray leading-tight">
              {currentQuestion.title}
            </h2>
          </div>

          <div className="grid gap-4">
            {currentQuestion.options.map((opt, i) => (
              <div key={i}>
                <WiiButton
                  onClick={() => {
                    setGcsAnswers({ ...gcsAnswers, [currentQuestion.key]: opt.value });
                    if (gcsStep < 2) {
                      setGcsStep(gcsStep + 1);
                    } else {
                      // We need to calculate it here because setGcsAnswers is async
                      const total = (currentQuestion.key === 'eye' ? opt.value : gcsAnswers.eye) + 
                                    (currentQuestion.key === 'verbal' ? opt.value : gcsAnswers.verbal) + 
                                    (currentQuestion.key === 'motor' ? opt.value : gcsAnswers.motor);
                      setGcsTotal(total);
                      setView('glasgowResult');
                      playSound('success');
                      
                      if (currentPatient) {
                        saveResult('Glasgow', { total, answers: { ...gcsAnswers, [currentQuestion.key]: opt.value } });
                      }
                    }
                  }}
                  className="w-full py-4 text-lg"
                >
                  {opt.label}
                </WiiButton>
              </div>
            ))}
          </div>

          {gcsStep > 0 && (
            <button 
              onClick={() => { playSound('back'); setGcsStep(gcsStep - 1); }}
              className="text-gray-400 font-bold hover:text-wii-blue transition-colors flex items-center gap-2 mx-auto"
            >
              <ChevronLeft size={20} /> Anterior
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderGlasgowResult = () => {
    let severity = "";
    let colorClass = "";
    if (gcsTotal! >= 13) {
      severity = "Leve";
      colorClass = "text-green-500";
    } else if (gcsTotal! >= 9) {
      severity = "Moderado";
      colorClass = "text-yellow-500";
    } else {
      severity = "Grave (Coma)";
      colorClass = "text-red-500";
    }

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[70vh] p-8 max-w-2xl mx-auto w-full"
      >
        <div className="wii-card p-12 w-full text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-wii-dark-gray">Escala de Glasgow</h2>
            <p className="text-gray-500">Puntuación total obtenida:</p>
          </div>

          <div className="relative py-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-8xl font-black text-wii-blue"
            >
              {gcsTotal}
            </motion.div>
            <div className={`text-2xl font-bold mt-4 uppercase tracking-widest ${colorClass}`}>
              {severity}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm font-bold text-gray-400 uppercase">
            <div>Ocular: {gcsAnswers.eye}</div>
            <div>Verbal: {gcsAnswers.verbal}</div>
            <div>Motor: {gcsAnswers.motor}</div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <WiiButton onClick={() => { setGcsStep(0); setView('glasgow'); }} className="w-full">
              Repetir Evaluación
            </WiiButton>
            <WiiButton onClick={() => setView('dashboard')} variant="secondary" className="w-full">
              Volver al Panel
            </WiiButton>
          </div>
        </div>
      </motion.div>
    );
  };

  useEffect(() => {
    // Setup background music
    audioRef.current = new Audio('https://ia801602.us.archive.org/11/items/wii-shop-channel-music_202305/Wii%20Shop%20Channel%20Music.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.15;

    // Attempt to play music on first user interaction to bypass browser autoplay blocks
    const startMusic = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        window.removeEventListener('click', startMusic);
        window.removeEventListener('keydown', startMusic);
      }
    };

    window.addEventListener('click', startMusic);
    window.addEventListener('keydown', startMusic);

    return () => {
      audioRef.current?.pause();
      window.removeEventListener('click', startMusic);
      window.removeEventListener('keydown', startMusic);
    };
  }, []);

  const toggleMusic = () => {
    if (isMusicPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(console.error);
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const renderStartPage = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12 p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 w-full"
      >
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-wii-dark-gray uppercase break-words px-4 font-wii">
          Da
        </h1>
        <p className="text-wii-blue font-bold tracking-[0.3em] uppercase text-xs md:text-sm px-4 font-wii">Canal de Soporte de Diagnóstico Clínico</p>
      </motion.div>

      <div className="wii-card p-10 max-w-md w-full flex flex-col items-center space-y-8">
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            id="policy-check"
            checked={policiesAccepted}
            onChange={(e) => setPoliciesAccepted(e.target.checked)}
            className="w-6 h-6 accent-wii-blue cursor-pointer"
          />
          <label htmlFor="policy-check" className="text-gray-600 font-medium select-none">
            Acepto las{' '}
            <button 
              onClick={() => { playSound('click'); setShowPolicyModal(true); }}
              className="text-wii-blue font-bold hover:underline underline-offset-4"
            >
              Políticas
            </button>
          </label>
        </div>

        <WiiButton 
          onClick={() => {
            if (policiesAccepted) {
              setView('patientSelection');
              fetchPatients();
            }
          }}
          disabled={!policiesAccepted}
          className="w-64 h-20 text-2xl font-bold"
        >
          INICIO
        </WiiButton>
      </div>
    </div>
  );

  const renderPatientSelection = () => (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[80vh] p-8 max-w-4xl mx-auto w-full space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-wii-dark-gray">Seleccionar Paciente</h2>
        <p className="text-gray-500">Elija un paciente existente o registre uno nuevo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { playSound('click'); setView('patientRegistration'); }}
          className="wii-grid-item group"
        >
          <div className="w-16 h-16 bg-wii-blue/10 rounded-2xl flex items-center justify-center text-wii-blue mb-4 group-hover:bg-wii-blue group-hover:text-white transition-all">
            <User size={32} />
          </div>
          <h3 className="text-xl font-bold">Nuevo Paciente</h3>
          <p className="text-gray-500 text-sm mt-2">Registrar datos básicos del paciente.</p>
        </motion.div>

        <div className="wii-card p-6 flex flex-col space-y-4 max-h-[400px] overflow-y-auto">
          <div className="flex items-center gap-2 text-wii-blue font-bold border-bottom pb-2">
            <Users size={20} />
            <span>Pacientes Recientes</span>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Cargando...</div>
          ) : patientsList.length === 0 ? (
            <div className="text-center py-8 text-gray-400 italic">No hay pacientes registrados.</div>
          ) : (
            <div className="space-y-3">
              {patientsList.map(p => (
                <button
                  key={p.id}
                  onClick={() => { 
                    playSound('click'); 
                    setCurrentPatient(p); 
                    fetchPatientDetails(p.id);
                    setView('dashboard'); 
                  }}
                  className="w-full text-left p-4 rounded-2xl bg-gray-50 hover:bg-wii-blue/10 transition-colors border-2 border-transparent hover:border-wii-blue/30 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-wii-dark-gray">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.age} años • {p.sex === 'M' ? 'Masculino' : 'Femenino'}</div>
                  </div>
                  <ChevronRight size={20} className="text-wii-blue" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <WiiButton onClick={() => setView('start')} variant="secondary">Volver</WiiButton>
    </motion.div>
  );

  const renderPatientRegistration = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[80vh] p-8 max-w-md mx-auto w-full"
    >
      <div className="wii-card p-10 w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-wii-dark-gray">Registrar Paciente</h2>
          <p className="text-gray-500">Ingrese los datos del paciente.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-2">Nombre Completo</label>
            <input 
              type="text" 
              value={newPatientForm.name}
              onChange={(e) => setNewPatientForm({...newPatientForm, name: e.target.value})}
              placeholder="Ej. Juan Pérez"
              className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-wii-blue outline-none transition-all font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-2">Edad</label>
              <input 
                type="number" 
                value={newPatientForm.age}
                onChange={(e) => setNewPatientForm({...newPatientForm, age: e.target.value})}
                placeholder="0"
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-wii-blue outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-2">Sexo</label>
              <select 
                value={newPatientForm.sex}
                onChange={(e) => setNewPatientForm({...newPatientForm, sex: e.target.value})}
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-wii-blue outline-none transition-all font-bold appearance-none"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <WiiButton 
            onClick={createPatient}
            disabled={!newPatientForm.name || !newPatientForm.age || isLoading}
            className="w-full h-16 text-xl"
          >
            {isLoading ? 'Registrando...' : 'Registrar'}
          </WiiButton>
          <WiiButton onClick={() => setView('patientSelection')} variant="secondary" className="w-full">
            Cancelar
          </WiiButton>
        </div>
      </div>
    </motion.div>
  );

  const renderPatientHistory = () => (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[80vh] p-8 max-w-4xl mx-auto w-full space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-wii-dark-gray">Historial Clínico</h2>
        <p className="text-wii-blue font-bold">{currentPatient?.name}</p>
      </div>

      <div className="wii-card p-8 w-full max-h-[500px] overflow-y-auto space-y-6">
        {currentPatient?.results && currentPatient.results.length > 0 ? (
          <div className="space-y-4">
            {currentPatient.results.map(r => {
              const data = JSON.parse(r.result_data);
              return (
                <div key={r.id} className="p-6 rounded-3xl bg-gray-50 border-2 border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${r.test_type === 'NASH' ? 'bg-wii-blue' : 'bg-purple-500'}`}>
                      {r.test_type === 'NASH' ? <BarChart2 size={24} /> : <Plus size={24} />}
                    </div>
                    <div>
                      <div className="font-bold text-wii-dark-gray">{r.test_type === 'NASH' ? 'Evaluación NASH' : 'Escala de Glasgow'}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-wii-blue">
                      {r.test_type === 'NASH' ? `${data.risk}%` : data.total}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-gray-400">Resultado</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 italic">No hay pruebas registradas para este paciente.</div>
        )}
      </div>

      <WiiButton onClick={() => setView('dashboard')} variant="secondary">Volver al Panel</WiiButton>
    </motion.div>
  );

  const renderQuestionnaire = () => {
    const questions = [
      {
        title: "¿Cuántos familiares de primer grado están afectados?",
        options: [
          { label: "2 familiares", value: 2 },
          { label: "3 o más familiares", value: 3 }
        ],
        key: 'relatives'
      },
      {
        title: "¿Cuál es su rango de edad?",
        options: [
          { label: "20-29 años", value: 0 },
          { label: "30-39 años", value: 1 },
          { label: "40-49 años", value: 2 },
          { label: "50-59 años", value: 3 },
          { label: "60-69 años", value: 4 }
        ],
        key: 'ageGroup'
      },
      {
        title: "¿Es fumador o ha fumado anteriormente?",
        options: [
          { label: "Sí", value: true },
          { label: "No", value: false }
        ],
        key: 'smoking'
      },
      {
        title: "¿Tiene hipertensión o toma medicamentos para la presión?",
        options: [
          { label: "Sí", value: true },
          { label: "No", value: false }
        ],
        key: 'hypertension'
      }
    ];

    const currentQuestion = questions[step];

    return (
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="flex flex-col items-center justify-center min-h-[70vh] p-8 max-w-2xl mx-auto w-full"
      >
        <div className="wii-card p-10 w-full space-y-8">
          <div className="space-y-2">
            <p className="text-wii-blue font-bold uppercase tracking-widest text-xs">Pregunta {step + 1} de 4</p>
            <h2 className="text-2xl md:text-3xl font-bold text-wii-dark-gray leading-tight">
              {currentQuestion.title}
            </h2>
          </div>

          <div className="grid gap-4">
            {currentQuestion.options.map((opt, i) => (
              <div key={i}>
                <WiiButton
                  onClick={() => {
                    setAnswers({ ...answers, [currentQuestion.key]: opt.value });
                    if (step < 3) {
                      setStep(step + 1);
                    } else {
                      calculateRisk();
                    }
                  }}
                  className="w-full py-6 text-xl"
                >
                  {opt.label}
                </WiiButton>
              </div>
            ))}
          </div>

          {step > 0 && (
            <button 
              onClick={() => { playSound('back'); setStep(step - 1); }}
              className="text-gray-400 font-bold hover:text-wii-blue transition-colors flex items-center gap-2 mx-auto"
            >
              <ChevronLeft size={20} /> Anterior
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderResult = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[70vh] p-8 max-w-2xl mx-auto w-full"
    >
      <div className="wii-card p-12 w-full text-center space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-wii-dark-gray">Resultado del Riesgo</h2>
          <p className="text-gray-500">Probabilidad estimada de encontrar un aneurisma intracraneal:</p>
        </div>

        <div className="relative py-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-7xl font-black text-wii-blue"
          >
            {riskResult}%
          </motion.div>
          <div className="mt-4 h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-white shadow-inner max-w-xs mx-auto">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${riskResult}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full ${riskResult && riskResult > 20 ? 'bg-red-500' : 'bg-wii-blue'}`}
            />
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed italic">
          *Basado en la puntuación NASH para personas con ≥2 familiares de primer grado afectados.
        </p>

        <div className="pt-4 flex flex-col gap-4">
          <WiiButton onClick={() => { setStep(0); setView('questionnaire'); }} className="w-full">
            Repetir Evaluación
          </WiiButton>
          <WiiButton onClick={() => setView('dashboard')} variant="secondary" className="w-full">
            Volver al Panel
          </WiiButton>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col wii-cursor">
      {/* Top Bar */}
      <header className="p-6 flex justify-between items-center">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => { playSound('back'); setView('start'); setStep(0); }}
        >
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-wii-dark-gray font-wii group-hover:text-wii-blue transition-colors">Da</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 md:px-6 py-2 rounded-full shadow-sm font-bold text-gray-400 text-sm">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === 'start' && renderStartPage()}
          {view === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 flex flex-col items-center space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold">Panel de Diagnóstico</h2>
                {currentPatient && (
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-wii-blue font-bold text-lg uppercase tracking-widest">{currentPatient.name}</p>
                    <p className="text-gray-400 text-xs font-bold uppercase">{currentPatient.age} años • {currentPatient.sex === 'M' ? 'Masculino' : 'Femenino'}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { playSound('click'); setView('questionnaire'); }}
                  className="wii-grid-item group"
                >
                  <div className="w-16 h-16 bg-wii-blue/10 rounded-2xl flex items-center justify-center text-wii-blue mb-4 group-hover:bg-wii-blue group-hover:text-white transition-all">
                    <BarChart2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Evaluación NASH</h3>
                  <p className="text-gray-500 text-sm mt-2">Predicción de riesgo basada en antecedentes familiares.</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { playSound('click'); setView('glasgow'); }}
                  className="wii-grid-item group"
                >
                  <div className="w-16 h-16 bg-wii-blue/10 rounded-2xl flex items-center justify-center text-wii-blue mb-4 group-hover:bg-wii-blue group-hover:text-white transition-all">
                    <Plus size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Escala de Glasgow</h3>
                  <p className="text-gray-500 text-sm mt-2">Evaluación del nivel de conciencia y estado neurológico.</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { playSound('click'); setView('patientHistory'); }}
                  className="wii-grid-item group"
                >
                  <div className="w-16 h-16 bg-wii-blue/10 rounded-2xl flex items-center justify-center text-wii-blue mb-4 group-hover:bg-wii-blue group-hover:text-white transition-all">
                    <ClipboardList size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Historial</h3>
                  <p className="text-gray-500 text-sm mt-2">Ver resultados previos de este paciente.</p>
                </motion.div>
              </div>

              <div className="flex gap-4">
                <WiiButton onClick={() => { setCurrentPatient(null); setView('patientSelection'); fetchPatients(); }} variant="secondary">Cambiar Paciente</WiiButton>
                <WiiButton onClick={() => { setCurrentPatient(null); setView('start'); }} variant="danger">Cerrar Sesión</WiiButton>
              </div>
            </motion.div>
          )}
          {view === 'questionnaire' && renderQuestionnaire()}
          {view === 'result' && renderResult()}
          {view === 'glasgow' && renderGlasgow()}
          {view === 'glasgowResult' && renderGlasgowResult()}
          {view === 'patientSelection' && renderPatientSelection()}
          {view === 'patientRegistration' && renderPatientRegistration()}
          {view === 'patientHistory' && renderPatientHistory()}
        </AnimatePresence>
      </main>

      {/* Policy Modal */}
      <AnimatePresence>
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPolicyModal(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="wii-card p-8 max-w-sm w-full relative z-10 text-center space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 bg-wii-blue/10 rounded-full flex items-center justify-center text-wii-blue">
                  <Info size={24} />
                </div>
                <button 
                  onClick={() => setShowPolicyModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <h3 className="text-2xl font-bold">Información de la Política</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Todo esto es informativo.
              </p>
              <WiiButton onClick={() => setShowPolicyModal(false)} className="w-full">
                Aceptar
              </WiiButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Bouncing Bubbles */}
      <BouncingBubbles />
    </div>
  );
}
