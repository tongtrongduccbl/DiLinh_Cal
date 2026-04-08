/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Activity, 
  Calculator, 
  Heart, 
  Info, 
  RefreshCcw, 
  User, 
  ChevronRight,
  Stethoscope,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// --- CHA2DS2-VASc Logic ---
interface Cha2ds2VascState {
  heartFailure: boolean;
  hypertension: boolean;
  age: 'under65' | '65to74' | 'over75';
  diabetes: boolean;
  stroke: boolean;
  vascular: boolean;
  sex: 'male' | 'female';
}

const initialChaState: Cha2ds2VascState = {
  heartFailure: false,
  hypertension: false,
  age: 'under65',
  diabetes: false,
  stroke: false,
  vascular: false,
  sex: 'male',
};

const getStrokeRisk = (score: number) => {
  const risks: Record<number, string> = {
    0: "0% (Nam), 0% (Nữ)",
    1: "1.3% (Nam), 1.3% (Nữ)",
    2: "2.2%",
    3: "3.2%",
    4: "4.0%",
    5: "6.7%",
    6: "9.8%",
    7: "9.6%",
    8: "6.7%",
    9: "15.2%",
  };
  return risks[score] || (score > 9 ? "15.2%+" : "0%");
};

const getRecommendation = (score: number, sex: 'male' | 'female') => {
  if (sex === 'male') {
    if (score === 0) return "Không cần điều trị chống đông.";
    if (score === 1) return "Cân nhắc dùng thuốc chống đông đường uống (OAC).";
    return "Khuyến cáo dùng thuốc chống đông đường uống (OAC).";
  } else {
    if (score === 1) return "Không cần điều trị chống đông.";
    if (score === 2) return "Cân nhắc dùng thuốc chống đông đường uống (OAC).";
    return "Khuyến cáo dùng thuốc chống đông đường uống (OAC).";
  }
};

// --- Z-Score Logic ---
interface ZScoreState {
  value: string;
  mean: string;
  sd: string;
}

const initialZState: ZScoreState = {
  value: '',
  mean: '',
  sd: '',
};

// --- ASCVD Logic ---
interface AscvdState {
  age: string;
  sex: 'male' | 'female';
  race: 'white' | 'aa';
  totalChol: string;
  hdl: string;
  sysBp: string;
  isHypertensionTreated: boolean;
  isDiabetes: boolean;
  isSmoker: boolean;
}

const initialAscvdState: AscvdState = {
  age: '',
  sex: 'male',
  race: 'white',
  totalChol: '',
  hdl: '',
  sysBp: '',
  isHypertensionTreated: false,
  isDiabetes: false,
  isSmoker: false,
};

const calculateAscvd = (state: AscvdState) => {
  const age = parseFloat(state.age);
  const tc = parseFloat(state.totalChol);
  const hdl = parseFloat(state.hdl);
  const sbp = parseFloat(state.sysBp);

  if (isNaN(age) || isNaN(tc) || isNaN(hdl) || isNaN(sbp)) return null;
  if (age < 40 || age > 79) return "N/A (Age 40-79 only)";

  const lnAge = Math.log(age);
  const lnTC = Math.log(tc);
  const lnHdl = Math.log(hdl);
  const lnSbp = Math.log(sbp);

  let s0, meanSum, sum;

  if (state.sex === 'female') {
    if (state.race === 'white') {
      s0 = 0.9665;
      meanSum = -29.18;
      sum = -29.799 * lnAge + 4.884 * Math.pow(lnAge, 2) + 13.54 * lnTC - 3.114 * lnAge * lnTC - 13.578 * lnHdl + 3.149 * lnAge * lnHdl + (state.isHypertensionTreated ? 2.019 : 1.957) * lnSbp + (state.isSmoker ? 7.574 : 0) - (state.isSmoker ? 1.665 * lnAge : 0) + (state.isDiabetes ? 0.661 : 0);
    } else {
      s0 = 0.9533;
      meanSum = 86.61;
      sum = 17.114 * lnAge + 0.94 * lnTC - 18.92 * lnHdl + 4.475 * lnAge * lnHdl + (state.isHypertensionTreated ? 29.291 : 27.82) * lnSbp - (state.isHypertensionTreated ? 6.432 : 5.895) * lnAge * lnSbp + (state.isSmoker ? 0.691 : 0) + (state.isDiabetes ? 0.874 : 0);
    }
  } else {
    if (state.race === 'white') {
      s0 = 0.9144;
      meanSum = 61.18;
      sum = 12.344 * lnAge + 11.853 * lnTC - 2.664 * lnAge * lnTC - 7.99 * lnHdl + 1.769 * lnAge * lnHdl + (state.isHypertensionTreated ? 1.797 : 1.764) * lnSbp + (state.isSmoker ? 7.837 : 0) - (state.isSmoker ? 1.795 * lnAge : 0) + (state.isDiabetes ? 0.658 : 0);
    } else {
      s0 = 0.8954;
      meanSum = 19.54;
      sum = 2.469 * lnAge + 0.302 * lnTC - 0.307 * lnHdl + (state.isHypertensionTreated ? 1.916 : 1.809) * lnSbp + (state.isSmoker ? 0.549 : 0) + (state.isDiabetes ? 0.645 : 0);
    }
  }

  const risk = 1 - Math.pow(s0, Math.exp(sum - meanSum));
  return (risk * 100).toFixed(1) + "%";
};

export default function App() {
  const [activeTab, setActiveTab] = useState('cha2ds2vasc');

  // ASCVD State
  const [ascvdState, setAscvdState] = useState<AscvdState>(initialAscvdState);
  const ascvdResult = useMemo(() => calculateAscvd(ascvdState), [ascvdState]);
  const resetAscvd = () => setAscvdState(initialAscvdState);

  // CHA2DS2-VASc State
  const [chaState, setChaState] = useState<Cha2ds2VascState>(initialChaState);

  const chaScore = useMemo(() => {
    let score = 0;
    if (chaState.heartFailure) score += 1;
    if (chaState.hypertension) score += 1;
    if (chaState.age === 'over75') score += 2;
    else if (chaState.age === '65to74') score += 1;
    if (chaState.diabetes) score += 1;
    if (chaState.stroke) score += 2;
    if (chaState.vascular) score += 1;
    if (chaState.sex === 'female') score += 1;
    return score;
  }, [chaState]);

  const resetCha = () => setChaState(initialChaState);

  // Z-Score State
  const [zState, setZState] = useState<ZScoreState>(initialZState);
  
  const zResult = useMemo(() => {
    const v = parseFloat(zState.value);
    const m = parseFloat(zState.mean);
    const s = parseFloat(zState.sd);
    if (isNaN(v) || isNaN(m) || isNaN(s) || s === 0) return null;
    return (v - m) / s;
  }, [zState]);

  const resetZ = () => setZState(initialZState);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-primary/10">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-primary">CardioCalc Pro</h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cardiovascular Decision Support</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-4 text-sm font-medium">
              <span className="text-primary border-b-2 border-primary pb-1">Calculators</span>
              <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Guidelines</span>
              <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">About</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Medical Calculators</h2>
                <p className="text-muted-foreground">Select a tool to begin clinical assessment.</p>
              </div>
              <TabsList className="grid w-full md:w-auto grid-cols-3 h-12 p-1 bg-muted/50">
                <TabsTrigger value="cha2ds2vasc" className="px-6 data-[state=active]:shadow-sm">
                  CHA₂DS₂-VASc
                </TabsTrigger>
                <TabsTrigger value="ascvd" className="px-6 data-[state=active]:shadow-sm">
                  ASCVD Risk
                </TabsTrigger>
                <TabsTrigger value="zscore" className="px-6 data-[state=active]:shadow-sm">
                  Z-Score
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="ascvd" key="ascvd">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-5 gap-8"
                >
                  <Card className="lg:col-span-3 border-none shadow-xl shadow-black/5">
                    <CardHeader className="bg-white border-b pb-6">
                      <div className="flex items-center gap-2 text-primary mb-1">
                        <Activity size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Atherosclerotic CVD</span>
                      </div>
                      <CardTitle className="text-2xl">ASCVD 10-Year Risk</CardTitle>
                      <CardDescription>Estimate 10-year risk for first hard ASCVD event.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold">Age (40-79)</Label>
                          <Input type="number" placeholder="Years" value={ascvdState.age} onChange={e => setAscvdState(s => ({ ...s, age: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold">Systolic BP</Label>
                          <Input type="number" placeholder="mmHg" value={ascvdState.sysBp} onChange={e => setAscvdState(s => ({ ...s, sysBp: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold">Total Cholesterol</Label>
                          <Input type="number" placeholder="mg/dL" value={ascvdState.totalChol} onChange={e => setAscvdState(s => ({ ...s, totalChol: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold">HDL Cholesterol</Label>
                          <Input type="number" placeholder="mg/dL" value={ascvdState.hdl} onChange={e => setAscvdState(s => ({ ...s, hdl: e.target.value }))} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold">Sex</Label>
                          <RadioGroup value={ascvdState.sex} onValueChange={v => setAscvdState(s => ({ ...s, sex: v as any }))} className="flex gap-2">
                            <Label className={cn("flex-1 p-2 border rounded-md text-center cursor-pointer", ascvdState.sex === 'male' && "bg-primary text-white")}>
                              <RadioGroupItem value="male" className="sr-only" /> Male
                            </Label>
                            <Label className={cn("flex-1 p-2 border rounded-md text-center cursor-pointer", ascvdState.sex === 'female' && "bg-primary text-white")}>
                              <RadioGroupItem value="female" className="sr-only" /> Female
                            </Label>
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold">Race</Label>
                          <RadioGroup value={ascvdState.race} onValueChange={v => setAscvdState(s => ({ ...s, race: v as any }))} className="flex gap-2">
                            <Label className={cn("flex-1 p-2 border rounded-md text-center cursor-pointer", ascvdState.race === 'white' && "bg-primary text-white")}>
                              <RadioGroupItem value="white" className="sr-only" /> White
                            </Label>
                            <Label className={cn("flex-1 p-2 border rounded-md text-center cursor-pointer", ascvdState.race === 'aa' && "bg-primary text-white")}>
                              <RadioGroupItem value="aa" className="sr-only" /> AA
                            </Label>
                          </RadioGroup>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <Label className="text-xs font-bold">Diabetes</Label>
                          <Checkbox checked={ascvdState.isDiabetes} onCheckedChange={v => setAscvdState(s => ({ ...s, isDiabetes: !!v }))} />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <Label className="text-xs font-bold">Smoker</Label>
                          <Checkbox checked={ascvdState.isSmoker} onCheckedChange={v => setAscvdState(s => ({ ...s, isSmoker: !!v }))} />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <Label className="text-xs font-bold">HTN Treated</Label>
                          <Checkbox checked={ascvdState.isHypertensionTreated} onCheckedChange={v => setAscvdState(s => ({ ...s, isHypertensionTreated: !!v }))} />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 p-4 flex justify-between">
                      <Button variant="ghost" size="sm" onClick={resetAscvd}>
                        <RefreshCcw size={14} className="mr-2" /> Reset
                      </Button>
                      <p className="text-[10px] text-muted-foreground italic">ACC/AHA 2013 Pooled Cohort Equations</p>
                    </CardFooter>
                  </Card>

                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-2xl shadow-primary/10 bg-primary text-white overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium opacity-90">10-Year Risk</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-8 flex flex-col items-center justify-center">
                        <motion.div key={ascvdResult} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-7xl font-black tracking-tighter">
                          {ascvdResult || '--'}
                        </motion.div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-black/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Risk Category</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {ascvdResult && !ascvdResult.includes('N/A') ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Risk Level</span>
                              <span className={cn(
                                "font-bold",
                                parseFloat(ascvdResult) < 5 ? "text-green-600" :
                                parseFloat(ascvdResult) < 7.5 ? "text-yellow-600" :
                                parseFloat(ascvdResult) < 20 ? "text-orange-600" : "text-red-600"
                              )}>
                                {parseFloat(ascvdResult) < 5 ? "Low Risk" :
                                 parseFloat(ascvdResult) < 7.5 ? "Borderline" :
                                 parseFloat(ascvdResult) < 20 ? "Intermediate" : "High Risk"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {parseFloat(ascvdResult) >= 7.5 ? "Statin therapy is generally recommended for intermediate and high risk groups." : "Lifestyle modification is the primary focus for low risk groups."}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Enter all values to see risk assessment.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="cha2ds2vasc" key="cha2ds2vasc">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-5 gap-8"
                >
                  {/* Input Section */}
                  <Card className="lg:col-span-3 border-none shadow-xl shadow-black/5 overflow-hidden">
                    <CardHeader className="bg-white border-b pb-6">
                      <div className="flex items-center gap-2 text-primary mb-1">
                        <Heart size={18} className="fill-primary/10" />
                        <span className="text-xs font-bold uppercase tracking-widest">Atrial Fibrillation</span>
                      </div>
                      <CardTitle className="text-2xl">CHA₂DS₂-VASc Score</CardTitle>
                      <CardDescription>Stroke risk assessment in patients with atrial fibrillation.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-white hover:border-primary/30 transition-colors group">
                          <div className="space-y-0.5">
                            <Label htmlFor="hf" className="text-base font-semibold cursor-pointer">Congestive Heart Failure</Label>
                            <p className="text-xs text-muted-foreground">Or Left Ventricular Dysfunction</p>
                          </div>
                          <Checkbox 
                            id="hf" 
                            checked={chaState.heartFailure} 
                            onCheckedChange={(checked) => setChaState(s => ({ ...s, heartFailure: !!checked }))}
                            className="h-6 w-6 rounded-md"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border bg-white hover:border-primary/30 transition-colors">
                          <div className="space-y-0.5">
                            <Label htmlFor="ht" className="text-base font-semibold cursor-pointer">Hypertension</Label>
                            <p className="text-xs text-muted-foreground">Blood pressure consistently {'>'}140/90 mmHg</p>
                          </div>
                          <Checkbox 
                            id="ht" 
                            checked={chaState.hypertension} 
                            onCheckedChange={(checked) => setChaState(s => ({ ...s, hypertension: !!checked }))}
                            className="h-6 w-6 rounded-md"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border bg-white hover:border-primary/30 transition-colors">
                          <div className="space-y-0.5">
                            <Label htmlFor="dm" className="text-base font-semibold cursor-pointer">Diabetes Mellitus</Label>
                            <p className="text-xs text-muted-foreground">Fasting glucose {'>'}126 mg/dL or treatment</p>
                          </div>
                          <Checkbox 
                            id="dm" 
                            checked={chaState.diabetes} 
                            onCheckedChange={(checked) => setChaState(s => ({ ...s, diabetes: !!checked }))}
                            className="h-6 w-6 rounded-md"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border bg-white hover:border-primary/30 transition-colors">
                          <div className="space-y-0.5">
                            <Label htmlFor="stroke" className="text-base font-semibold cursor-pointer">Stroke / TIA / TE</Label>
                            <p className="text-xs text-muted-foreground">History of stroke, TIA or thromboembolism (+2)</p>
                          </div>
                          <Checkbox 
                            id="stroke" 
                            checked={chaState.stroke} 
                            onCheckedChange={(checked) => setChaState(s => ({ ...s, stroke: !!checked }))}
                            className="h-6 w-6 rounded-md border-primary/50 data-[state=checked]:bg-primary"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border bg-white hover:border-primary/30 transition-colors">
                          <div className="space-y-0.5">
                            <Label htmlFor="vascular" className="text-base font-semibold cursor-pointer">Vascular Disease</Label>
                            <p className="text-xs text-muted-foreground">Prior MI, PAD, or aortic plaque</p>
                          </div>
                          <Checkbox 
                            id="vascular" 
                            checked={chaState.vascular} 
                            onCheckedChange={(checked) => setChaState(s => ({ ...s, vascular: !!checked }))}
                            className="h-6 w-6 rounded-md"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Age Category</Label>
                        <RadioGroup 
                          value={chaState.age} 
                          onValueChange={(v) => setChaState(s => ({ ...s, age: v as any }))}
                          className="grid grid-cols-3 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="under65" id="age1" className="sr-only" />
                            <Label 
                              htmlFor="age1" 
                              className={cn(
                                "flex-1 text-center py-3 px-2 rounded-lg border cursor-pointer transition-all",
                                chaState.age === 'under65' ? "bg-primary text-white border-primary shadow-md" : "bg-white hover:bg-muted"
                              )}
                            >
                              {'<'} 65
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="65to74" id="age2" className="sr-only" />
                            <Label 
                              htmlFor="age2" 
                              className={cn(
                                "flex-1 text-center py-3 px-2 rounded-lg border cursor-pointer transition-all",
                                chaState.age === '65to74' ? "bg-primary text-white border-primary shadow-md" : "bg-white hover:bg-muted"
                              )}
                            >
                              65 - 74
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="over75" id="age3" className="sr-only" />
                            <Label 
                              htmlFor="age3" 
                              className={cn(
                                "flex-1 text-center py-3 px-2 rounded-lg border cursor-pointer transition-all",
                                chaState.age === 'over75' ? "bg-primary text-white border-primary shadow-md" : "bg-white hover:bg-muted"
                              )}
                            >
                              ≥ 75
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sex Category</Label>
                        <RadioGroup 
                          value={chaState.sex} 
                          onValueChange={(v) => setChaState(s => ({ ...s, sex: v as any }))}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="sex1" className="sr-only" />
                            <Label 
                              htmlFor="sex1" 
                              className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-all",
                                chaState.sex === 'male' ? "bg-primary text-white border-primary shadow-md" : "bg-white hover:bg-muted"
                              )}
                            >
                              <User size={16} /> Nam
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="sex2" className="sr-only" />
                            <Label 
                              htmlFor="sex2" 
                              className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-all",
                                chaState.sex === 'female' ? "bg-primary text-white border-primary shadow-md" : "bg-white hover:bg-muted"
                              )}
                            >
                              <User size={16} /> Nữ
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 p-4 flex justify-between">
                      <Button variant="ghost" size="sm" onClick={resetCha} className="text-muted-foreground hover:text-destructive">
                        <RefreshCcw size={14} className="mr-2" /> Reset
                      </Button>
                      <p className="text-[10px] text-muted-foreground italic">Source: ESC Guidelines 2020</p>
                    </CardFooter>
                  </Card>

                  {/* Result Section */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-2xl shadow-primary/10 bg-primary text-white overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium opacity-90">Total Score</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-8 flex flex-col items-center justify-center">
                        <motion.div 
                          key={chaScore}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-8xl font-black tracking-tighter"
                        >
                          {chaScore}
                        </motion.div>
                        <div className="mt-4 px-4 py-1.5 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm">
                          Points
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-black/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Clinical Risk</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Stroke Risk / Year</span>
                          <span className="text-xl font-bold text-primary">{getStrokeRisk(chaScore)}</span>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Info size={14} className="text-primary" />
                            Recommendation
                          </span>
                          <p className="text-sm leading-relaxed text-muted-foreground bg-muted/50 p-3 rounded-lg border border-dashed">
                            {getRecommendation(chaScore, chaState.sex)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-black/5 bg-amber-50 border-l-4 border-l-amber-400">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Activity className="text-amber-500 shrink-0" size={20} />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Clinical Note</p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                              This tool is for professional use only. Clinical judgment should always prevail over calculated scores.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="zscore" key="zscore">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-5 gap-8"
                >
                  <Card className="lg:col-span-3 border-none shadow-xl shadow-black/5">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-primary mb-1">
                        <TrendingUp size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Statistics</span>
                      </div>
                      <CardTitle className="text-2xl">General Z-Score</CardTitle>
                      <CardDescription>Calculate standard score for any medical parameter.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="val" className="text-sm font-bold">Measured Value (x)</Label>
                          <div className="relative">
                            <Input 
                              id="val" 
                              type="number" 
                              placeholder="e.g. 15.5" 
                              value={zState.value}
                              onChange={(e) => setZState(s => ({ ...s, value: e.target.value }))}
                              className="h-12 pl-4 text-lg"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">Value</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="mean" className="text-sm font-bold">Mean (μ)</Label>
                            <Input 
                              id="mean" 
                              type="number" 
                              placeholder="e.g. 12.0" 
                              value={zState.mean}
                              onChange={(e) => setZState(s => ({ ...s, mean: e.target.value }))}
                              className="h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sd" className="text-sm font-bold">Std Dev (σ)</Label>
                            <Input 
                              id="sd" 
                              type="number" 
                              placeholder="e.g. 1.5" 
                              value={zState.sd}
                              onChange={(e) => setZState(s => ({ ...s, sd: e.target.value }))}
                              className="h-12"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-muted/30 rounded-2xl border border-dashed flex flex-col items-center justify-center space-y-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Formula</p>
                        <div className="text-xl font-mono italic text-primary">
                          Z = (x - μ) / σ
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 p-4 flex justify-between">
                      <Button variant="ghost" size="sm" onClick={resetZ} className="text-muted-foreground hover:text-destructive">
                        <RefreshCcw size={14} className="mr-2" /> Reset
                      </Button>
                    </CardFooter>
                  </Card>

                  <div className="lg:col-span-2 space-y-6">
                    <Card className={cn(
                      "border-none transition-all duration-500 overflow-hidden",
                      zResult !== null ? "shadow-2xl shadow-primary/20 bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium opacity-90">Calculated Z-Score</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-8 flex flex-col items-center justify-center">
                        <motion.div 
                          key={zResult}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-7xl font-black tracking-tighter"
                        >
                          {zResult !== null ? zResult.toFixed(2) : '--'}
                        </motion.div>
                        <div className="mt-4 px-4 py-1.5 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm">
                          Standard Deviations
                        </div>
                      </CardContent>
                    </Card>

                    {zResult !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="border-none shadow-xl shadow-black/5">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Interpretation</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Status</span>
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                Math.abs(zResult) <= 2 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              )}>
                                {Math.abs(zResult) <= 2 ? "Normal Range" : "Abnormal Range"}
                              </span>
                            </div>
                            <Separator />
                            <div className="space-y-3">
                              <div className="flex justify-between text-xs">
                                <span>-3σ</span>
                                <span>-2σ</span>
                                <span>-1σ</span>
                                <span>0</span>
                                <span>+1σ</span>
                                <span>+2σ</span>
                                <span>+3σ</span>
                              </div>
                              <div className="h-3 w-full bg-muted rounded-full relative overflow-hidden">
                                <div className="absolute inset-y-0 left-1/3 right-1/3 bg-green-500/20" />
                                <motion.div 
                                  className="absolute top-0 bottom-0 w-1 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] z-10"
                                  initial={{ left: '50%' }}
                                  animate={{ left: `${Math.max(0, Math.min(100, (zResult + 4) * 12.5))}%` }}
                                  transition={{ type: 'spring', stiffness: 100 }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground text-center italic">
                                Normal range is typically between -2 and +2 Z-scores.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    <Card className="border-none shadow-xl shadow-black/5">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold">Quick Reference</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[180px] px-6 pb-6">
                          <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Z = 0</span>
                              <span className="font-medium">50th Percentile</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Z = +1.645</span>
                              <span className="font-medium">95th Percentile</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Z = +1.96</span>
                              <span className="font-medium">97.5th Percentile</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Z = +2.33</span>
                              <span className="font-medium">99th Percentile</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Z = -2.0</span>
                              <span className="font-medium">2.3rd Percentile</span>
                            </div>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>

        {/* Footer Info */}
        <footer className="mt-16 pt-8 border-t text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calculator size={12} />
              <span>Evidence-Based</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart size={12} />
              <span>Clinical Support</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity size={12} />
              <span>Real-time Calc</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground max-w-md mx-auto leading-relaxed">
            Disclaimer: These calculators are intended for use by healthcare professionals. They are not a substitute for professional medical advice, diagnosis, or treatment.
          </p>
        </footer>
      </main>
    </div>
  );
}
