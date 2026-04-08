import { useState, useMemo, FormEvent } from 'react';
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
  FileText,
  Settings,
  BookOpen,
  ClipboardList,
  Search,
  Smartphone
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

const LoginScreen = ({ onLogin }: { onLogin: (name: string, dept: string) => void }) => {
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() && dept.trim()) {
      onLogin(name.trim(), dept.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="clinical-card border-t-4 border-t-primary">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-2">
              <Stethoscope size={32} />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">DI LINH HOSPITAL CALC</CardTitle>
            <CardDescription className="text-sm font-medium uppercase tracking-widest">Xác thực nhân viên y tế</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="login-name" className="text-xs font-bold uppercase tracking-widest text-slate-500">Họ và tên bác sĩ</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    id="login-name"
                    placeholder="VD: Nguyễn Văn A" 
                    className="pl-10 h-12 font-bold"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-dept" className="text-xs font-bold uppercase tracking-widest text-slate-500">Khoa công tác</Label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    id="login-dept"
                    placeholder="VD: Khoa Nội Tim Mạch" 
                    className="pl-10 h-12 font-bold"
                    value={dept}
                    onChange={e => setDept(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20">
                Truy cập hệ thống
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-slate-50 bg-slate-50/50 p-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
              Hệ thống hỗ trợ quyết định lâm sàng nội bộ
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

const Layout = ({ userInfo, onLogout }: { userInfo: { name: string, department: string }, onLogout: () => void }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900 font-sans">
      {/* Clinical Header */}
      <header className="clinical-header">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm">
              <Stethoscope size={24} />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-none text-primary uppercase tracking-tight">DI LINH HOSPITAL CALC</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Clinical Decision Support</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors flex items-center gap-2">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/viewer" className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors flex items-center gap-2">
                <Eye size={16} /> Viewer
              </Link>
              <Link to="/admin" className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors flex items-center gap-2">
                <ShieldCheck size={16} /> Admin
              </Link>
            </nav>
            
            <Separator orientation="vertical" className="h-8 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-none">{userInfo.name}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{userInfo.department}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout} className="h-8 w-8 text-slate-400 hover:text-red-500">
                <RefreshCcw size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Outlet />
      </main>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Stethoscope size={24} />
                <span className="font-bold text-lg uppercase tracking-tight">DI LINH HOSPITAL CALC</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống hỗ trợ quyết định lâm sàng được thiết kế để tối ưu hóa quy trình làm việc của bác sĩ tại Bệnh viện Di Linh.
              </p>
              <div className="pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Người tạo chương trình</p>
                <p className="text-sm font-bold text-slate-700">BS. TỐNG TRỌNG ĐỨC</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Hỗ trợ phát triển</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sự ủng hộ của quý đồng nghiệp là động lực để ứng dụng ngày càng hoàn thiện và phát triển thêm nhiều tính năng mới.
              </p>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-24 h-24 bg-white p-1 rounded-lg shadow-sm flex-shrink-0">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://me.momo.vn/0358740165" 
                    alt="QR Code Support" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Quét mã QR</p>
                  <p className="text-[11px] font-medium text-slate-500 italic">"Xin tài trợ để ứng dụng ngày càng phát triển"</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Tiêu chuẩn y khoa</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <ShieldCheck size={14} className="text-primary" />
                  <span>Bảo mật dữ liệu nội bộ</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <FileText size={14} className="text-primary" />
                  <span>Hướng dẫn ESC/ACC 2026</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Activity size={14} className="text-primary" />
                  <span>Cập nhật thời gian thực</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              © 2026 DI LINH HOSPITAL • PHÁT TRIỂN BỞI TỐNG TRỌNG ĐỨC
            </p>
            <p className="text-[10px] text-slate-400 max-w-md text-center md:text-right leading-relaxed italic">
              CẢNH BÁO: Kết quả tính toán chỉ mang tính chất tham khảo và không thay thế cho chẩn đoán lâm sàng của bác sĩ.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};


const Dashboard = () => {
  const calculators = [
    {
      id: 'cha2ds2vasc',
      title: 'CHA₂DS₂-VASc',
      desc: 'Đánh giá nguy cơ đột quỵ ở bệnh nhân rung nhĩ.',
      icon: <Heart className="text-primary" />,
      tag: 'Stroke Risk'
    },
    {
      id: 'ascvd',
      title: 'ASCVD Risk',
      desc: 'Ước tính nguy cơ biến cố tim mạch xơ vữa 10 năm.',
      icon: <Activity className="text-primary" />,
      tag: '10-Year Risk'
    },
    {
      id: 'zscore',
      title: 'Z-Score',
      desc: 'Tính toán độ lệch chuẩn cho các thông số lâm sàng.',
      icon: <TrendingUp className="text-primary" />,
      tag: 'Standardization'
    }
  ];

  const pocketTools = [
    {
      id: 'guidelines',
      title: 'Phác đồ Điều trị',
      desc: 'Tra cứu nhanh các phác đồ điều trị nội khoa cập nhật.',
      icon: <BookOpen className="text-primary" />,
      tag: 'Guidelines'
    },
    {
      id: 'med-calc',
      title: 'Liều lượng Thuốc',
      desc: 'Tính toán liều lượng thuốc theo cân nặng và chức năng thận.',
      icon: <ClipboardList className="text-primary" />,
      tag: 'Medication'
    },
    {
      id: 'lab-ref',
      title: 'Chỉ số Xét nghiệm',
      desc: 'Bảng tra cứu các chỉ số xét nghiệm bình thường.',
      icon: <Search className="text-primary" />,
      tag: 'Lab Values'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Section 1: Calculators */}
      <div className="space-y-6">
        <div className="border-l-4 border-primary pl-4 py-1">
          <h2 className="text-2xl font-bold text-slate-800">Công cụ Tính toán Lâm sàng</h2>
          <p className="text-slate-500 text-sm">Các thuật toán hỗ trợ chẩn đoán và tiên lượng.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {calculators.map((app, idx) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={`/calc/${app.id}`}>
                <Card className="clinical-card h-full flex flex-col no-underline">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                        {app.icon}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        {app.tag}
                      </span>
                    </div>
                    <CardTitle className="text-lg text-slate-800">{app.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed min-h-[32px]">
                      {app.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto pt-4 border-t border-slate-50">
                    <div className="flex items-center text-xs font-bold text-primary uppercase tracking-wider gap-1 group">
                      Mở công cụ <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section 2: Pocket Tools */}
      <div className="space-y-6">
        <div className="border-l-4 border-primary pl-4 py-1">
          <h2 className="text-2xl font-bold text-slate-800">Sổ tay Lâm sàng (Pocket)</h2>
          <p className="text-slate-500 text-sm">Tra cứu nhanh thông tin y khoa tại giường bệnh.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pocketTools.map((app, idx) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx + 3) * 0.05 }}
            >
              <Card className="clinical-card h-full flex flex-col opacity-75 grayscale-[0.5] cursor-not-allowed">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                      {app.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                      {app.tag}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-slate-800">{app.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed min-h-[32px]">
                    {app.desc}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto pt-4 border-t border-slate-50">
                  <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider gap-1">
                    Sắp ra mắt
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Card className="bg-slate-900 text-white border-none p-8 rounded-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Stethoscope size={120} />
        </div>
        <div className="relative z-10 max-w-lg space-y-4">
          <h3 className="text-xl font-bold">Hệ thống Hỗ trợ Quyết định Lâm sàng</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Di Linh Hospital Calc cung cấp các thuật toán chuẩn hóa theo hướng dẫn của ESC (Hội Tim mạch Châu Âu) và ACC/AHA (Trường Cao đẳng Tim mạch Hoa Kỳ).
          </p>
          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <ShieldCheck size={16} /> Verified
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <RefreshCcw size={16} /> Updated 2026
            </div>
          </div>
        </div>
      </Card>
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
      <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-slate-500 hover:text-primary">
        <ArrowLeft size={16} className="mr-2" /> Quay lại Dashboard
      </Button>

      {id === 'cha2ds2vasc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">CHA₂DS₂-VASc Score</CardTitle>
                <CardDescription>Nguy cơ đột quỵ ở bệnh nhân rung nhĩ phi van tim.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {[
                  { id: 'hf', label: 'Suy tim sung huyết', sub: 'Hoặc rối loạn chức năng thất trái', key: 'heartFailure' },
                  { id: 'ht', label: 'Tăng huyết áp', sub: 'HA > 140/90 hoặc đang điều trị', key: 'hypertension' },
                  { id: 'dm', label: 'Đái tháo đường', sub: 'Đường huyết đói > 126mg/dL', key: 'diabetes' },
                  { id: 'stroke', label: 'Đột quỵ / TIA / Thuyên tắc', sub: 'Tiền sử biến cố mạch máu (+2)', key: 'stroke' },
                  { id: 'vascular', label: 'Bệnh mạch máu', sub: 'NMCT, bệnh mạch máu ngoại biên', key: 'vascular' },
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-primary/20 transition-colors">
                    <div className="space-y-0.5">
                      <Label htmlFor={item.id} className="text-sm font-bold cursor-pointer text-slate-700">{item.label}</Label>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.sub}</p>
                    </div>
                    <Checkbox 
                      id={item.id} 
                      checked={(chaState as any)[item.key]} 
                      onCheckedChange={(v) => setChaState(s => ({ ...s, [item.key]: !!v }))}
                      className="h-5 w-5"
                    />
                  </div>
                ))}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nhóm tuổi</Label>
                    <RadioGroup value={chaState.age} onValueChange={v => setChaState(s => ({ ...s, age: v as any }))} className="grid grid-cols-1 gap-2">
                      {['under65', '65to74', 'over75'].map(a => (
                        <Label key={a} className={cn("flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer text-xs font-bold transition-all", chaState.age === a ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100 hover:bg-slate-50")}>
                          <RadioGroupItem value={a} />
                          {a === 'under65' ? '< 65 tuổi' : a === '65to74' ? '65 - 74 tuổi' : '≥ 75 tuổi'}
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giới tính</Label>
                    <RadioGroup value={chaState.sex} onValueChange={v => setChaState(s => ({ ...s, sex: v as any }))} className="grid grid-cols-1 gap-2">
                      {['male', 'female'].map(s => (
                        <Label key={s} className={cn("flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer text-xs font-bold transition-all", chaState.sex === s ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100 hover:bg-slate-50")}>
                          <RadioGroupItem value={s} />
                          {s === 'male' ? 'Nam giới' : 'Nữ giới'}
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setChaState(initialChaState)} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Info size={12} /> ESC Guidelines 2020
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Kết quả tính toán</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-8xl font-black text-primary tracking-tighter">{chaScore}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Tổng điểm</div>
              </CardContent>
            </Card>

            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Đánh giá lâm sàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">Nguy cơ đột quỵ/năm</span>
                  <span className="text-xl font-black text-primary">{getStrokeRisk(chaScore)}</span>
                </div>
                <Separator className="bg-slate-100" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                    <Activity size={14} /> Khuyến cáo điều trị
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm leading-relaxed font-medium text-slate-700 italic">
                    "{getRecommendation(chaScore, chaState.sex)}"
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'ascvd' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">ASCVD Risk Calculator</CardTitle>
                <CardDescription>Dự đoán nguy cơ biến cố tim mạch xơ vữa trong 10 năm.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tuổi (40-79)</Label>
                    <Input type="number" value={ascvdState.age} onChange={e => setAscvdState(s => ({ ...s, age: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Huyết áp tâm thu (mmHg)</Label>
                    <Input type="number" value={ascvdState.sysBp} onChange={e => setAscvdState(s => ({ ...s, sysBp: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cholesterol toàn phần (mg/dL)</Label>
                    <Input type="number" value={ascvdState.totalChol} onChange={e => setAscvdState(s => ({ ...s, totalChol: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">HDL Cholesterol (mg/dL)</Label>
                    <Input type="number" value={ascvdState.hdl} onChange={e => setAscvdState(s => ({ ...s, hdl: e.target.value }))} className="h-10 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giới tính</Label>
                    <RadioGroup value={ascvdState.sex} onValueChange={v => setAscvdState(s => ({ ...s, sex: v as any }))} className="flex gap-2">
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", ascvdState.sex === 'male' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="male" className="sr-only" /> Nam
                      </Label>
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", ascvdState.sex === 'female' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="female" className="sr-only" /> Nữ
                      </Label>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Chủng tộc</Label>
                    <RadioGroup value={ascvdState.race} onValueChange={v => setAscvdState(s => ({ ...s, race: v as any }))} className="flex gap-2">
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", ascvdState.race === 'white' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="white" className="sr-only" /> Da trắng
                      </Label>
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", ascvdState.race === 'aa' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
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
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/30">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</Label>
                      <Checkbox checked={(ascvdState as any)[item.key]} onCheckedChange={v => setAscvdState(s => ({ ...s, [item.key]: !!v }))} />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setAscvdState(initialAscvdState)} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Info size={12} /> ACC/AHA 2013
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Nguy cơ 10 năm</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-7xl font-black text-primary tracking-tighter">{ascvdResult || '--'}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Xác suất biến cố</div>
              </CardContent>
            </Card>

            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Phân loại mức độ</CardTitle>
              </CardHeader>
              <CardContent>
                {ascvdResult && !ascvdResult.includes('N/A') ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">Mức độ nguy cơ</span>
                      <span className={cn(
                        "px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                        parseFloat(ascvdResult) < 5 ? "bg-green-100 text-green-700" :
                        parseFloat(ascvdResult) < 7.5 ? "bg-yellow-100 text-yellow-700" :
                        parseFloat(ascvdResult) < 20 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                      )}>
                        {parseFloat(ascvdResult) < 5 ? "Thấp" :
                         parseFloat(ascvdResult) < 7.5 ? "Giới hạn" :
                         parseFloat(ascvdResult) < 20 ? "Trung bình" : "Cao"}
                      </span>
                    </div>
                    <Separator className="bg-slate-100" />
                    <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                      {parseFloat(ascvdResult) >= 7.5 ? "Khuyến cáo: Cân nhắc liệu pháp Statin cường độ trung bình đến cao." : "Khuyến cáo: Tập trung vào thay đổi lối sống và kiểm soát các yếu tố nguy cơ."}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">Nhập đầy đủ thông tin bệnh nhân để xem đánh giá.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'zscore' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">Z-Score Calculator</CardTitle>
                <CardDescription>Chuẩn hóa dữ liệu lâm sàng so với quần thể tham chiếu.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giá trị đo được (x)</Label>
                  <Input type="number" placeholder="VD: 15.5" value={zState.value} onChange={e => setZState(s => ({ ...s, value: e.target.value }))} className="h-12 text-xl font-bold text-primary" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Trung bình (μ)</Label>
                    <Input type="number" placeholder="VD: 12.0" value={zState.mean} onChange={e => setZState(s => ({ ...s, mean: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Độ lệch chuẩn (σ)</Label>
                    <Input type="number" placeholder="VD: 1.5" value={zState.sd} onChange={e => setZState(s => ({ ...s, sd: e.target.value }))} className="h-10 font-bold" />
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Công thức</span>
                  <div className="text-2xl font-serif italic text-slate-600">Z = (x - μ) / σ</div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4">
                <Button variant="outline" size="sm" onClick={() => setZState({ value: '', mean: '', sd: '' })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className={cn("clinical-card transition-all duration-500", zResult !== null ? "border-primary/20 bg-primary/5" : "bg-slate-50")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Kết quả Z-Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-8xl font-black text-primary tracking-tighter">{zResult !== null ? zResult.toFixed(2) : '--'}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Độ lệch chuẩn (SD)</div>
              </CardContent>
            </Card>
            
            {zResult !== null && (
              <Card className="clinical-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Phân tích phân phối</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-600">Trạng thái</span>
                    <span className={cn("px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest", Math.abs(zResult) <= 2 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {Math.abs(zResult) <= 2 ? "Bình thường" : "Bất thường"}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-slate-100 rounded-full relative">
                      <div className="absolute inset-y-0 left-1/4 right-1/4 bg-green-500/10" />
                      <motion.div 
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-sm z-10"
                        initial={{ left: '50%' }}
                        animate={{ left: `${Math.max(0, Math.min(100, (zResult + 4) * 12.5))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>-4 SD</span><span>-2 SD</span><span>0</span><span>+2 SD</span><span>+4 SD</span>
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
    <div className="border-l-4 border-primary pl-4 py-1">
      <h2 className="text-2xl font-bold text-slate-800">Hệ thống Quản trị</h2>
      <p className="text-slate-500 text-sm">Quản lý cấu hình thuật toán và dữ liệu hệ thống.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { title: 'Cấu hình Thuật toán', desc: 'Điều chỉnh các hằng số và ngưỡng cảnh báo y khoa.', icon: <Settings /> },
        { title: 'Nhật ký Hệ thống', desc: 'Theo dõi các lượt tính toán và hiệu suất ứng dụng.', icon: <FileText /> },
        { title: 'Quản lý Tài khoản', desc: 'Phân quyền truy cập cho nhân viên bệnh viện.', icon: <User /> }
      ].map((item, i) => (
        <Card key={i} className="clinical-card cursor-pointer">
          <CardHeader>
            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-primary mb-2 border border-slate-100">
              {item.icon}
            </div>
            <CardTitle className="text-lg text-slate-800">{item.title}</CardTitle>
            <CardDescription className="text-xs">{item.desc}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
    
    <div className="p-12 bg-white border border-dashed border-slate-200 rounded-xl text-center space-y-4">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
        <ShieldCheck size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-700">Chế độ Bảo trì</h3>
      <p className="text-slate-500 text-sm max-w-md mx-auto">Các tính năng quản trị nâng cao đang được cập nhật để đảm bảo tính bảo mật và chính xác cao nhất.</p>
    </div>
  </div>
);

const ViewerPage = () => (
  <div className="space-y-8">
    <div className="border-l-4 border-primary pl-4 py-1">
      <h2 className="text-2xl font-bold text-slate-800">Thông tin cho Người xem</h2>
      <p className="text-slate-500 text-sm">Kiến thức y khoa phổ thông và hướng dẫn bệnh nhân.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="clinical-card overflow-hidden">
          <div className="h-32 bg-primary/5 flex items-center justify-center">
            <Heart size={64} className="text-primary/20" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">Hiểu về Nguy cơ Tim mạch</CardTitle>
            <CardDescription>Tại sao việc tính toán các chỉ số lại quan trọng?</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-slate text-sm text-slate-600 leading-relaxed space-y-4">
            <p>
              Việc đánh giá nguy cơ tim mạch giúp bác sĩ đưa ra các quyết định điều trị chính xác hơn, từ việc sử dụng thuốc chống đông đến việc điều chỉnh lối sống.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h4 className="font-bold text-primary mb-1">Rung nhĩ</h4>
                <p className="text-xs">Một rối loạn nhịp tim có thể gây ra cục máu đông và dẫn đến đột quỵ.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h4 className="font-bold text-primary mb-1">Xơ vữa mạch máu</h4>
                <p className="text-xs">Sự tích tụ mảng bám trong động mạch, nguyên nhân chính gây nhồi máu cơ tim.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card className="clinical-card bg-primary text-white border-none">
          <CardHeader>
            <CardTitle className="text-lg">Tư vấn Bác sĩ</CardTitle>
          </CardHeader>
          <CardContent className="text-sm opacity-90 leading-relaxed">
            Nếu bạn có bất kỳ thắc mắc nào về kết quả tính toán, hãy liên hệ trực tiếp với bác sĩ điều trị tại Di Linh Hospital để được giải đáp chi tiết.
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full font-bold text-primary">Đặt lịch khám</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
);

export default function App() {
  const [userInfo, setUserInfo] = useState<{ name: string; department: string } | null>(() => {
    const saved = localStorage.getItem('hospital_user_info');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (name: string, department: string) => {
    const info = { name, department };
    setUserInfo(info);
    localStorage.setItem('hospital_user_info', JSON.stringify(info));
  };

  const handleLogout = () => {
    setUserInfo(null);
    localStorage.removeItem('hospital_user_info');
  };

  if (!userInfo) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout userInfo={userInfo} onLogout={handleLogout} />}>
        <Route index element={<Dashboard />} />
        <Route path="calc/:id" element={<CalculatorPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="viewer" element={<ViewerPage />} />
      </Route>
    </Routes>
  );
}
