import { useState, useMemo } from 'react';
import { 
  Routes, 
  Route, 
  Link, 
  useParams, 
  useNavigate,
  Outlet
} from 'react-router-dom';
import { 
  Activity, 
  Calculator, 
  Heart, 
  Info, 
  RefreshCcw, 
  User, 
  ChevronRight,
  Stethoscope,
  TrendingUp,
  LayoutDashboard,
  ShieldCheck,
  Eye,
  ArrowLeft,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// --- Logic & Types ---

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
  if (age < 40 || age > 79) return "N/A (Chỉ dành cho tuổi 40-79)";

  const lnAge = Math.log(age);
  const lnTC = Math.log(tc);
  const lnHdl = Math.log(hdl);
  const lnSbp = Math.log(sbp);

  let s0, meanSum, sum;

  if (state.sex === 'female') {
    if (state.race === 'white') {
      s0 = 0.9665; meanSum = -29.18;
      sum = -29.799 * lnAge + 4.884 * Math.pow(lnAge, 2) + 13.54 * lnTC - 3.114 * lnAge * lnTC - 13.578 * lnHdl + 3.149 * lnAge * lnHdl + (state.isHypertensionTreated ? 2.019 : 1.957) * lnSbp + (state.isSmoker ? 7.574 : 0) - (state.isSmoker ? 1.665 * lnAge : 0) + (state.isDiabetes ? 0.661 : 0);
    } else {
      s0 = 0.9533; meanSum = 86.61;
      sum = 17.114 * lnAge + 0.94 * lnTC - 18.92 * lnHdl + 4.475 * lnAge * lnHdl + (state.isHypertensionTreated ? 29.291 : 27.82) * lnSbp - (state.isHypertensionTreated ? 6.432 : 5.895) * lnAge * lnSbp + (state.isSmoker ? 0.691 : 0) + (state.isDiabetes ? 0.874 : 0);
    }
  } else {
    if (state.race === 'white') {
      s0 = 0.9144; meanSum = 61.18;
      sum = 12.344 * lnAge + 11.853 * lnTC - 2.664 * lnAge * lnTC - 7.99 * lnHdl + 1.769 * lnAge * lnHdl + (state.isHypertensionTreated ? 1.797 : 1.764) * lnSbp + (state.isSmoker ? 7.837 : 0) - (state.isSmoker ? 1.795 * lnAge : 0) + (state.isDiabetes ? 0.658 : 0);
    } else {
      s0 = 0.8954; meanSum = 19.54;
      sum = 2.469 * lnAge + 0.302 * lnTC - 0.307 * lnHdl + (state.isHypertensionTreated ? 1.916 : 1.809) * lnSbp + (state.isSmoker ? 0.549 : 0) + (state.isDiabetes ? 0.645 : 0);
    }
  }

  const risk = 1 - Math.pow(s0, Math.exp(sum - meanSum));
  return (risk * 100).toFixed(1) + "%";
};

// --- Components ---

const Layout = () => {
  const [userInfo, setUserInfo] = useState({ name: '', department: '' });

  return (
    <div className="min-h-screen text-[#1A1A1A] font-sans selection:bg-primary/10 relative overflow-x-hidden">
      {/* Background with Heart Theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#FDFDFD]">
        <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/seed/heart-medical/1920/1080')] bg-cover bg-center grayscale" />
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[5%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px]" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b glass">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
              <Heart size={28} className="fill-white/20" />
            </div>
            <div>
              <h1 className="font-black text-xl leading-tight text-primary tracking-tight">TỐNG TRỌNG ĐỨC</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">CardioCalc Pro</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            <nav className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
              <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white hover:shadow-sm transition-all flex items-center gap-2">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/viewer" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white hover:shadow-sm transition-all flex items-center gap-2">
                <Eye size={16} /> Người xem
              </Link>
              <Link to="/admin" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white hover:shadow-sm transition-all flex items-center gap-2">
                <ShieldCheck size={16} /> Admin
              </Link>
            </nav>

            <div className="flex gap-2">
              <Input 
                placeholder="Họ tên bác sĩ" 
                className="h-9 w-40 text-xs glass border-primary/20 focus:border-primary"
                value={userInfo.name}
                onChange={(e) => setUserInfo(s => ({ ...s, name: e.target.value }))}
              />
              <Input 
                placeholder="Khoa công tác" 
                className="h-9 w-40 text-xs glass border-primary/20 focus:border-primary"
                value={userInfo.department}
                onChange={(e) => setUserInfo(s => ({ ...s, department: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Outlet />
      </main>

      <footer className="mt-20 border-t glass py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center md:text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-2 text-primary">
                <Stethoscope size={24} />
                <span className="font-bold text-lg">CardioCalc Pro</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto md:mx-0">
                Hệ thống hỗ trợ quyết định lâm sàng chuyên sâu cho bác sĩ tim mạch, phát triển bởi chuyên gia y tế.
              </p>
            </div>

            <div className="space-y-4 bg-primary/5 p-6 rounded-3xl border border-primary/10">
              <div className="flex items-center justify-center gap-2 text-primary font-bold">
                <CreditCard size={20} />
                <span>Hỗ trợ phát triển</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Momo: <span className="text-primary font-bold">0358740165</span></p>
                <p className="text-[10px] text-muted-foreground mt-1">Mọi sự hỗ trợ đều giúp ứng dụng ngày càng tốt hơn.</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold">Người tạo app</p>
              <p className="text-xl font-black text-primary">TỐNG TRỌNG ĐỨC</p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-4 opacity-50">
                <Heart size={16} />
                <Activity size={16} />
                <TrendingUp size={16} />
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            <span>© 2026 CardioCalc Pro - All Rights Reserved</span>
            <span className="text-center">Miễn trừ trách nhiệm: Chỉ dành cho nhân viên y tế chuyên nghiệp</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Dashboard = () => {
  const apps = [
    {
      id: 'cha2ds2vasc',
      title: 'CHA₂DS₂-VASc',
      desc: 'Đánh giá nguy cơ đột quỵ ở bệnh nhân rung nhĩ.',
      icon: <Heart className="text-primary" />,
      color: 'bg-green-50'
    },
    {
      id: 'ascvd',
      title: 'ASCVD Risk',
      desc: 'Ước tính nguy cơ biến cố tim mạch xơ vữa 10 năm.',
      icon: <Activity className="text-primary" />,
      color: 'bg-emerald-50'
    },
    {
      id: 'zscore',
      title: 'Z-Score',
      desc: 'Tính toán điểm chuẩn cho các thông số y tế.',
      icon: <TrendingUp className="text-primary" />,
      color: 'bg-teal-50'
    }
  ];

  return (
    <div className="space-y-10">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black tracking-tight text-primary"
        >
          Trung tâm Tính toán Tim mạch
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-lg"
        >
          Hệ thống công cụ y khoa chính xác, nhanh chóng và hiện đại dành cho bác sĩ.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {apps.map((app, idx) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link to={`/calc/${app.id}`}>
              <Card className="h-full glass-card hover:-translate-y-2 transition-all cursor-pointer group overflow-hidden border-none">
                <div className={cn("h-2 w-full", app.id === 'cha2ds2vasc' ? 'bg-green-500' : app.id === 'ascvd' ? 'bg-emerald-500' : 'bg-teal-500')} />
                <CardHeader>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-inner", app.color)}>
                    {app.icon}
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{app.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{app.desc}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <div className="flex items-center text-xs font-bold text-primary uppercase tracking-wider gap-1">
                    Bắt đầu tính toán <ChevronRight size={14} />
                  </div>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const CalculatorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Common State
  const [chaState, setChaState] = useState(initialChaState);
  const [ascvdState, setAscvdState] = useState(initialAscvdState);
  const [zState, setZState] = useState({ value: '', mean: '', sd: '' });

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

  const ascvdResult = useMemo(() => calculateAscvd(ascvdState), [ascvdState]);

  const zResult = useMemo(() => {
    const v = parseFloat(zState.value);
    const m = parseFloat(zState.mean);
    const s = parseFloat(zState.sd);
    if (isNaN(v) || isNaN(m) || isNaN(s) || s === 0) return null;
    return (v - m) / s;
  }, [zState]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 hover:bg-primary/10 hover:text-primary">
        <ArrowLeft size={16} className="mr-2" /> Quay lại Dashboard
      </Button>

      {id === 'cha2ds2vasc' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-3 border-none glass-card overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-2xl text-primary">CHA₂DS₂-VASc Score</CardTitle>
              <CardDescription>Đánh giá nguy cơ đột quỵ ở bệnh nhân rung nhĩ.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { id: 'hf', label: 'Suy tim sung huyết', sub: 'Hoặc rối loạn chức năng thất trái', key: 'heartFailure' },
                { id: 'ht', label: 'Tăng huyết áp', sub: 'HA > 140/90 hoặc đang điều trị', key: 'hypertension' },
                { id: 'dm', label: 'Đái tháo đường', sub: 'Đường huyết đói > 126mg/dL', key: 'diabetes' },
                { id: 'stroke', label: 'Đột quỵ / TIA / Thuyên tắc', sub: 'Tiền sử biến cố mạch máu (+2)', key: 'stroke' },
                { id: 'vascular', label: 'Bệnh mạch máu', sub: 'NMCT, bệnh mạch máu ngoại biên', key: 'vascular' },
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border bg-white/50 hover:border-primary transition-all">
                  <div className="space-y-0.5">
                    <Label htmlFor={item.id} className="text-base font-bold cursor-pointer">{item.label}</Label>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                  <Checkbox 
                    id={item.id} 
                    checked={(chaState as any)[item.key]} 
                    onCheckedChange={(v) => setChaState(s => ({ ...s, [item.key]: !!v }))}
                    className="h-6 w-6"
                  />
                </div>
              ))}
              <Separator />
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-primary">Nhóm tuổi</Label>
                <RadioGroup value={chaState.age} onValueChange={v => setChaState(s => ({ ...s, age: v as any }))} className="grid grid-cols-3 gap-2">
                  {['under65', '65to74', 'over75'].map(a => (
                    <Label key={a} className={cn("p-3 border rounded-xl text-center cursor-pointer text-sm font-bold transition-all", chaState.age === a ? "bg-primary text-white border-primary shadow-lg" : "bg-white/50 hover:bg-muted")}>
                      <RadioGroupItem value={a} className="sr-only" />
                      {a === 'under65' ? '< 65' : a === '65to74' ? '65-74' : '≥ 75'}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-primary">Giới tính</Label>
                <RadioGroup value={chaState.sex} onValueChange={v => setChaState(s => ({ ...s, sex: v as any }))} className="grid grid-cols-2 gap-2">
                  {['male', 'female'].map(s => (
                    <Label key={s} className={cn("p-3 border rounded-xl text-center cursor-pointer text-sm font-bold transition-all", chaState.sex === s ? "bg-primary text-white border-primary shadow-lg" : "bg-white/50 hover:bg-muted")}>
                      <RadioGroupItem value={s} className="sr-only" />
                      {s === 'male' ? 'Nam' : 'Nữ'}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 p-4 flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setChaState(initialChaState)}>
                <RefreshCcw size={14} className="mr-2" /> Làm mới
              </Button>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">ESC Guidelines 2020</span>
            </CardFooter>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none bg-primary text-white shadow-2xl shadow-primary/30 overflow-hidden rounded-3xl">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-medium opacity-80">Tổng điểm</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-10">
                <div className="text-9xl font-black tracking-tighter">{chaScore}</div>
                <div className="mt-4 px-6 py-2 bg-white/20 rounded-full text-sm font-black uppercase tracking-widest backdrop-blur-md">Điểm</div>
              </CardContent>
            </Card>
            <Card className="border-none glass-card rounded-3xl">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Kết quả lâm sàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Nguy cơ đột quỵ/năm</span>
                  <span className="text-2xl font-black text-primary">{getStrokeRisk(chaScore)}</span>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                    <Info size={14} /> Khuyến cáo
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 border-dashed text-sm leading-relaxed font-medium">
                    {getRecommendation(chaScore, chaState.sex)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'ascvd' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-3 border-none glass-card overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-2xl text-primary">ASCVD Risk Calculator</CardTitle>
              <CardDescription>Ước tính nguy cơ biến cố tim mạch xơ vữa đầu tiên trong 10 năm.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Tuổi (40-79)</Label>
                  <Input type="number" value={ascvdState.age} onChange={e => setAscvdState(s => ({ ...s, age: e.target.value }))} className="h-12 text-lg font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Huyết áp tâm thu</Label>
                  <Input type="number" value={ascvdState.sysBp} onChange={e => setAscvdState(s => ({ ...s, sysBp: e.target.value }))} className="h-12 text-lg font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Cholesterol toàn phần</Label>
                  <Input type="number" value={ascvdState.totalChol} onChange={e => setAscvdState(s => ({ ...s, totalChol: e.target.value }))} className="h-12 text-lg font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">HDL Cholesterol</Label>
                  <Input type="number" value={ascvdState.hdl} onChange={e => setAscvdState(s => ({ ...s, hdl: e.target.value }))} className="h-12 text-lg font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Giới tính</Label>
                  <RadioGroup value={ascvdState.sex} onValueChange={v => setAscvdState(s => ({ ...s, sex: v as any }))} className="flex gap-2">
                    <Label className={cn("flex-1 p-3 border rounded-xl text-center cursor-pointer font-bold", ascvdState.sex === 'male' ? "bg-primary text-white" : "bg-white/50")}>
                      <RadioGroupItem value="male" className="sr-only" /> Nam
                    </Label>
                    <Label className={cn("flex-1 p-3 border rounded-xl text-center cursor-pointer font-bold", ascvdState.sex === 'female' ? "bg-primary text-white" : "bg-white/50")}>
                      <RadioGroupItem value="female" className="sr-only" /> Nữ
                    </Label>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Chủng tộc</Label>
                  <RadioGroup value={ascvdState.race} onValueChange={v => setAscvdState(s => ({ ...s, race: v as any }))} className="flex gap-2">
                    <Label className={cn("flex-1 p-3 border rounded-xl text-center cursor-pointer font-bold", ascvdState.race === 'white' ? "bg-primary text-white" : "bg-white/50")}>
                      <RadioGroupItem value="white" className="sr-only" /> Da trắng
                    </Label>
                    <Label className={cn("flex-1 p-3 border rounded-xl text-center cursor-pointer font-bold", ascvdState.race === 'aa' ? "bg-primary text-white" : "bg-white/50")}>
                      <RadioGroupItem value="aa" className="sr-only" /> Da màu
                    </Label>
                  </RadioGroup>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'dm', label: 'Tiểu đường', key: 'isDiabetes' },
                  { id: 'sm', label: 'Hút thuốc', key: 'isSmoker' },
                  { id: 'ht', label: 'Điều trị HA', key: 'isHypertensionTreated' },
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border bg-white/50">
                    <Label className="text-xs font-black uppercase tracking-widest">{item.label}</Label>
                    <Checkbox checked={(ascvdState as any)[item.key]} onCheckedChange={v => setAscvdState(s => ({ ...s, [item.key]: !!v }))} />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 p-4 flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setAscvdState(initialAscvdState)}>
                <RefreshCcw size={14} className="mr-2" /> Làm mới
              </Button>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">ACC/AHA 2013</span>
            </CardFooter>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none bg-primary text-white shadow-2xl shadow-primary/30 overflow-hidden rounded-3xl">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-medium opacity-80">Nguy cơ 10 năm</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-10">
                <div className="text-7xl font-black tracking-tighter">{ascvdResult || '--'}</div>
                <div className="mt-4 px-6 py-2 bg-white/20 rounded-full text-sm font-black uppercase tracking-widest backdrop-blur-md">Xác suất</div>
              </CardContent>
            </Card>
            <Card className="border-none glass-card rounded-3xl">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Phân loại nguy cơ</CardTitle>
              </CardHeader>
              <CardContent>
                {ascvdResult && !ascvdResult.includes('N/A') ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">Mức độ</span>
                      <span className={cn(
                        "px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest",
                        parseFloat(ascvdResult) < 5 ? "bg-green-100 text-green-700" :
                        parseFloat(ascvdResult) < 7.5 ? "bg-yellow-100 text-yellow-700" :
                        parseFloat(ascvdResult) < 20 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                      )}>
                        {parseFloat(ascvdResult) < 5 ? "Thấp" :
                         parseFloat(ascvdResult) < 7.5 ? "Giới hạn" :
                         parseFloat(ascvdResult) < 20 ? "Trung bình" : "Cao"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      {parseFloat(ascvdResult) >= 7.5 ? "Cân nhắc liệu pháp Statin cường độ trung bình đến cao." : "Tập trung vào thay đổi lối sống và kiểm soát các yếu tố nguy cơ."}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nhập đầy đủ thông tin để xem đánh giá.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'zscore' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-3 border-none glass-card overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-2xl text-primary">Z-Score Calculator</CardTitle>
              <CardDescription>Tính toán độ lệch chuẩn so với giá trị trung bình quần thể.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest">Giá trị đo được (x)</Label>
                <Input type="number" placeholder="VD: 15.5" value={zState.value} onChange={e => setZState(s => ({ ...s, value: e.target.value }))} className="h-14 text-2xl font-black text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Trung bình (μ)</Label>
                  <Input type="number" placeholder="VD: 12.0" value={zState.mean} onChange={e => setZState(s => ({ ...s, mean: e.target.value }))} className="h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Độ lệch chuẩn (σ)</Label>
                  <Input type="number" placeholder="VD: 1.5" value={zState.sd} onChange={e => setZState(s => ({ ...s, sd: e.target.value }))} className="h-12 font-bold" />
                </div>
              </div>
              <div className="p-8 bg-primary/5 rounded-3xl border border-dashed border-primary/30 flex flex-col items-center justify-center space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Công thức chuẩn</span>
                <div className="text-3xl font-serif italic text-primary">Z = (x - μ) / σ</div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 p-4">
              <Button variant="ghost" size="sm" onClick={() => setZState({ value: '', mean: '', sd: '' })}>
                <RefreshCcw size={14} className="mr-2" /> Làm mới
              </Button>
            </CardFooter>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className={cn("border-none shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden", zResult !== null ? "bg-primary text-white shadow-primary/30" : "bg-muted text-muted-foreground")}>
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-medium opacity-80">Z-Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-10">
                <div className="text-8xl font-black tracking-tighter">{zResult !== null ? zResult.toFixed(2) : '--'}</div>
                <div className="mt-4 px-6 py-2 bg-white/20 rounded-full text-sm font-black uppercase tracking-widest backdrop-blur-md">SD Units</div>
              </CardContent>
            </Card>
            {zResult !== null && (
              <Card className="border-none glass-card rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Phân tích</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Trạng thái</span>
                    <span className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", Math.abs(zResult) <= 2 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {Math.abs(zResult) <= 2 ? "Bình thường" : "Bất thường"}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-muted rounded-full relative overflow-hidden">
                      <div className="absolute inset-y-0 left-1/4 right-1/4 bg-green-500/20" />
                      <motion.div 
                        className="absolute top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_12px_rgba(var(--primary),0.8)] z-10"
                        initial={{ left: '50%' }}
                        animate={{ left: `${Math.max(0, Math.min(100, (zResult + 4) * 12.5))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-muted-foreground">
                      <span>-4</span><span>-2</span><span>0</span><span>+2</span><span>+4</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminPage = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
        <ShieldCheck size={32} />
      </div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-primary">Quản trị viên</h2>
        <p className="text-muted-foreground">Quản lý cấu hình hệ thống và dữ liệu lâm sàng.</p>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { title: 'Cấu hình App', desc: 'Thay đổi các tham số tính toán và ngưỡng khuyến cáo.', icon: <Calculator /> },
        { title: 'Dữ liệu người dùng', desc: 'Xem lịch sử sử dụng và thống kê truy cập.', icon: <User /> },
        { title: 'Bản cập nhật', desc: 'Kiểm tra và áp dụng các hướng dẫn y khoa mới nhất.', icon: <RefreshCcw /> }
      ].map((item, i) => (
        <Card key={i} className="glass-card border-none hover:shadow-2xl transition-all cursor-pointer">
          <CardHeader>
            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-2">
              {item.icon}
            </div>
            <CardTitle className="text-lg">{item.title}</CardTitle>
            <CardDescription>{item.desc}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
    
    <Card className="border-none glass-card p-12 text-center space-y-4">
      <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary/40">
        <Info size={40} />
      </div>
      <h3 className="text-xl font-bold">Tính năng đang phát triển</h3>
      <p className="text-muted-foreground max-w-md mx-auto">Hệ thống quản trị đang được hoàn thiện để cung cấp khả năng tùy biến cao hơn cho các cơ sở y tế.</p>
    </Card>
  </div>
);

const ViewerPage = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
        <Eye size={32} />
      </div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-primary">Trang Người xem</h2>
        <p className="text-muted-foreground">Dành cho bệnh nhân và người nhà tìm hiểu thông tin.</p>
      </div>
    </div>

    <Card className="border-none glass-card overflow-hidden">
      <div className="h-48 bg-primary/10 flex items-center justify-center">
        <Heart size={80} className="text-primary/20 animate-pulse" />
      </div>
      <CardHeader>
        <CardTitle className="text-2xl">Kiến thức Tim mạch phổ thông</CardTitle>
        <CardDescription>Tìm hiểu về các yếu tố nguy cơ và cách bảo vệ trái tim của bạn.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-white/50 rounded-3xl border border-primary/10 space-y-2">
            <h4 className="font-bold text-primary">Rung nhĩ là gì?</h4>
            <p className="text-sm text-muted-foreground">Rung nhĩ là một dạng rối loạn nhịp tim phổ biến có thể dẫn đến đột quỵ nếu không được điều trị.</p>
          </div>
          <div className="p-6 bg-white/50 rounded-3xl border border-primary/10 space-y-2">
            <h4 className="font-bold text-primary">Kiểm soát huyết áp</h4>
            <p className="text-sm text-muted-foreground">Duy trì huyết áp dưới 130/80 mmHg giúp giảm đáng kể nguy cơ biến cố tim mạch.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="calc/:id" element={<CalculatorPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="viewer" element={<ViewerPage />} />
      </Route>
    </Routes>
  );
}
