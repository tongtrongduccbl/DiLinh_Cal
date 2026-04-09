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

interface Cha2ds2VaState {
  heartFailure: boolean;
  hypertension: boolean;
  age: 'under65' | '65to74' | 'over75';
  diabetes: boolean;
  stroke: boolean;
  vascular: boolean;
}

const initialChaState: Cha2ds2VaState = {
  heartFailure: false,
  hypertension: false,
  age: 'under65',
  diabetes: false,
  stroke: false,
  vascular: false,
};

const getStrokeRisk = (score: number) => {
  const risks: Record<number, string> = {
    0: "0%",
    1: "1.3%",
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

const getRecommendation = (score: number) => {
  if (score === 0) return "Không cần điều trị chống đông.";
  if (score === 1) return "Cân nhắc dùng thuốc chống đông đường uống (OAC).";
  return "Khuyến cáo dùng thuốc chống đông đường uống (OAC).";
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
  unit: 'mg/dL' | 'mmol/L';
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
  unit: 'mg/dL',
};

const calculateAscvd = (state: AscvdState) => {
  const age = parseFloat(state.age);
  let tc = parseFloat(state.totalChol);
  let hdl = parseFloat(state.hdl);
  const sbp = parseFloat(state.sysBp);

  if (state.unit === 'mmol/L') {
    tc = tc * 38.67;
    hdl = hdl * 38.67;
  }

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
    <div className="min-h-screen flex items-center justify-center bg-hospital-blur p-4 relative">
      <div className="absolute inset-0 bg-overlay z-0"></div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
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
                    placeholder="VD: TỐNG TRỌNG ĐỨC" 
                    className="pl-10 h-12 font-bold placeholder:text-slate-300 placeholder:font-normal"
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
                    placeholder="VD: HỒI SỨC CẤP CỨU" 
                    className="pl-10 h-12 font-bold placeholder:text-slate-300 placeholder:font-normal"
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
    <div className="min-h-screen flex flex-col bg-hospital-blur text-slate-900 font-sans relative">
      <div className="absolute inset-0 bg-overlay z-0"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
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
                Mọi sự đóng góp, dù là nhỏ nhất, đều là nguồn động lực quý giá để chúng tôi tiếp tục hoàn thiện và phát triển ứng dụng này.
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
                  <p className="text-[11px] font-medium text-slate-500 italic">"Đóng góp hỗ trợ phát triển ứng dụng"</p>
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
    </div>
  );
};


const GuidelinesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const guidelines = [
    {
      id: 'hf',
      title: 'Suy tim mạn tính (HF)',
      update: 'Viện Tim 2025',
      content: [
        { subtitle: 'Tứ trụ trong điều trị (HFrEF)', text: '1. SGLT2i (Dapagliflozin/Empagliflozin)\n2. ARNI (Sacubitril/Valsartan) hoặc ACEi/ARB\n3. Chẹn Beta (Bisoprolol, Carvedilol, Metoprolol succinate)\n4. MRA (Spironolactone, Eplerenone)' },
        { subtitle: 'Mục tiêu điều trị', text: 'Giảm triệu chứng, giảm tỷ lệ nhập viện và tử vong. Tối ưu hóa liều lượng mỗi 2 tuần nếu bệnh nhân dung nạp.' }
      ]
    },
    {
      id: 'htn',
      title: 'Tăng huyết áp (HTN)',
      update: 'Viện Tim 2025',
      content: [
        { subtitle: 'Ngưỡng điều trị', text: '≥ 140/90 mmHg (tại phòng khám) hoặc ≥ 130/80 mmHg (nếu có nguy cơ tim mạch cao/đái tháo đường/bệnh thận mạn).' },
        { subtitle: 'Phác đồ ưu tiên', text: 'Phối hợp 2 thuốc ngay từ đầu (ACEi/ARB + CCB hoặc ACEi/ARB + Lợi tiểu). Ưu tiên viên phối hợp liều cố định (SPC).' }
      ]
    },
    {
      id: 'acs',
      title: 'Hội chứng mạch vành cấp (ACS)',
      update: 'Viện Tim 2025',
      content: [
        { subtitle: 'Xử trí ban đầu', text: 'MONA (Morphine, Oxygen, Nitroglycerin, Aspirin). Tải liều Aspirin 162-325mg + P2Y12 inhibitor.' },
        { subtitle: 'Chiến lược can thiệp', text: 'STEMI: Can thiệp mạch vành thì đầu (Primary PCI) trong vòng 120 phút. NSTEMI: Đánh giá nguy cơ (GRACE score) để quyết định thời điểm can thiệp.' }
      ]
    },
    {
      id: 'af',
      title: 'Rung nhĩ (AF)',
      update: 'Viện Tim 2025',
      content: [
        { subtitle: 'Kiểm soát nhịp và tần số', text: 'Ưu tiên kiểm soát tần số (Digoxin, Beta-blocker, CCB) trừ khi triệu chứng dai dẳng hoặc suy tim do nhịp nhanh.' },
        { subtitle: 'Dự phòng thuyên tắc', text: 'Đánh giá CHA₂DS₂-VASc. Ưu tiên NOAC (Dabigatran, Rivaroxaban, Apixaban) hơn Warfarin trừ hẹp van hai lá trung bình-nặng hoặc van cơ học.' }
      ]
    }
  ];

  const filtered = guidelines.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.content.some(c => c.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="border-l-4 border-primary pl-4 py-1">
          <h2 className="text-2xl font-bold text-slate-800">Phác đồ Điều trị</h2>
          <p className="text-slate-500 text-sm">Hướng dẫn cập nhật Viện Tim TP.HCM 2025</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Tìm kiếm phác đồ..." 
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filtered.map((g) => (
          <Card key={g.id} className="clinical-card overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-primary">{g.title}</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Cập nhật: {g.update}</CardDescription>
              </div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                <BookOpen size={20} className="text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {g.content.map((c, i) => (
                <div key={i} className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {c.subtitle}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/30 p-3 rounded-lg border border-slate-50">
                    {c.text}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <Search size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Không tìm thấy phác đồ phù hợp với từ khóa.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const calculators = [
    { id: 'cha2ds2va', title: 'CHA₂DS₂-VA', desc: 'Đánh giá nguy cơ đột quỵ ở bệnh nhân rung nhĩ.', icon: <Heart className="text-primary" />, tag: 'Cardiology' },
    { id: 'ascvd', title: 'ASCVD Risk', desc: 'Ước tính nguy cơ biến cố tim mạch xơ vữa 10 năm.', icon: <Activity className="text-primary" />, tag: 'Cardiology' },
    { id: 'zscore_hf', title: 'Z-Score HF', desc: 'Tính toán Z-Score cho bệnh nhân suy tim.', icon: <Activity className="text-primary" />, tag: 'Cardiology' },
    { id: 'clcr', title: 'Creatinine Clearance', desc: 'Độ thanh thải Creatinine (Cockcroft-Gault).', icon: <Activity className="text-primary" />, tag: 'Nephrology' },
    { id: 'egfr', title: 'eGFR (CKD-EPI)', desc: 'Mức lọc cầu thận ước tính.', icon: <Activity className="text-primary" />, tag: 'Nephrology' },
    { id: 'childpugh', title: 'Child-Pugh', desc: 'Đánh giá mức độ xơ gan.', icon: <Activity className="text-primary" />, tag: 'Gastroenterology' },
    { id: 'hasbled', title: 'HAS-BLED', desc: 'Nguy cơ chảy máu ở bệnh nhân rung nhĩ.', icon: <Heart className="text-primary" />, tag: 'Cardiology' },
    { id: 'ldlc', title: 'LDL-C (Friedewald)', desc: 'Tính LDL Cholesterol.', icon: <Activity className="text-primary" />, tag: 'Cardiology' },
    { id: 'glasgow', title: 'Glasgow (GCS)', desc: 'Thang điểm hôn mê Glasgow.', icon: <Activity className="text-primary" />, tag: 'Neurology' },
    { id: 'curb65', title: 'CURB-65', desc: 'Đánh giá mức độ nặng viêm phổi cộng đồng.', icon: <Activity className="text-primary" />, tag: 'Pulmonology' },
    { id: 'sofa', title: 'SOFA Score', desc: 'Đánh giá suy đa tạng trong nhiễm trùng huyết.', icon: <Activity className="text-primary" />, tag: 'ICU' },
    { id: 'arc_hbr', title: 'ARC-HBR', desc: 'Nguy cơ chảy máu cao (High Bleeding Risk).', icon: <Heart className="text-primary" />, tag: 'Cardiology' },
    { id: 'score2', title: 'SCORE2', desc: 'Nguy cơ tim mạch 10 năm (Châu Âu).', icon: <Heart className="text-primary" />, tag: 'Cardiology' },
    { id: 'score2_diabetes', title: 'SCORE2-Diabetes', desc: 'Nguy cơ tim mạch ở bệnh nhân ĐTĐ.', icon: <Heart className="text-primary" />, tag: 'Cardiology' },
    { id: 'prevent', title: 'PREVENT', desc: 'AHA/ACC PREVENT Risk Calculator.', icon: <Heart className="text-primary" />, tag: 'Cardiology' },
  ];

  const pocketTools = [
    {
      id: 'guidelines',
      title: 'Phác đồ Điều trị',
      desc: 'Tra cứu nhanh các phác đồ điều trị nội khoa cập nhật.',
      icon: <BookOpen className="text-primary" />,
      tag: 'Guidelines',
      link: '/guidelines'
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
              {app.link ? (
                <Link to={app.link}>
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
                        Mở sổ tay <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ) : (
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
              )}
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

  const [clcrState, setClcrState] = useState({ age: '', weight: '', creat: '', sex: 'male', unit: 'mg/dL' });
  const [ldlcState, setLdlcState] = useState({ tc: '', hdl: '', tg: '', unit: 'mg/dL' });
  const [hasbledState, setHasbledState] = useState({ htn: false, renal: false, liver: false, stroke: false, bleeding: false, labileInr: false, elderly: false, drugs: false, alcohol: false });

  const [egfrState, setEgfrState] = useState({ age: '', creat: '', sex: 'male', unit: 'mg/dL' });
  const [childpughState, setChildpughState] = useState({ bili: '', albumin: '', inr: '', ascites: 'none', enceph: 'none', unit: 'mg/dL' });
  const [glasgowState, setGlasgowState] = useState({ eye: 4, verbal: 5, motor: 6 });
  const [curb65State, setCurb65State] = useState({ confusion: false, urea: false, resp: false, bp: false, age: false });

  const [sofaState, setSofaState] = useState({
    pao2: '', fio2: '', vent: false,
    platelets: '',
    bili: '', biliUnit: 'mg/dL',
    map: '', vaso: 'none',
    gcs: 15,
    creat: '', creatUnit: 'mg/dL', urine: ''
  });

  const [archbrState, setArchbrState] = useState({
    major: [] as string[],
    minor: [] as string[]
  });

  const [score2State, setScore2State] = useState({
    age: '', sex: 'male', smoker: false,
    sysBp: '',
    nonHdl: '', nonHdlUnit: 'mmol/L',
    region: 'moderate'
  });

  const [score2DmState, setScore2DmState] = useState({
    age: '', sex: 'male', smoker: false,
    sysBp: '',
    nonHdl: '', nonHdlUnit: 'mmol/L',
    hba1c: '', hba1cUnit: '%',
    egfr: '',
    ageDm: '',
    region: 'moderate'
  });

  const [preventState, setPreventState] = useState({
    age: '', sex: 'male',
    tc: '', hdl: '', unit: 'mg/dL',
    sysBp: '',
    egfr: '',
    smoker: false,
    diabetes: false,
    statin: false,
    antiHyp: false
  });

  const sofaScore = useMemo(() => {
    let score = 0;
    
    const pao2 = parseFloat(sofaState.pao2);
    const fio2 = parseFloat(sofaState.fio2);
    if (!isNaN(pao2) && !isNaN(fio2) && fio2 > 0) {
      const ratio = pao2 / (fio2 > 1 ? fio2 / 100 : fio2);
      if (ratio < 100 && sofaState.vent) score += 4;
      else if (ratio < 200 && sofaState.vent) score += 3;
      else if (ratio < 300) score += 2;
      else if (ratio < 400) score += 1;
    }

    const plt = parseFloat(sofaState.platelets);
    if (!isNaN(plt)) {
      if (plt < 20) score += 4;
      else if (plt < 50) score += 3;
      else if (plt < 100) score += 2;
      else if (plt < 150) score += 1;
    }

    let bili = parseFloat(sofaState.bili);
    if (sofaState.biliUnit === 'umol/L') bili = bili / 17.1;
    if (!isNaN(bili)) {
      if (bili > 12.0) score += 4;
      else if (bili >= 6.0) score += 3;
      else if (bili >= 2.0) score += 2;
      else if (bili >= 1.2) score += 1;
    }

    if (sofaState.vaso === 'high') score += 4;
    else if (sofaState.vaso === 'med') score += 3;
    else if (sofaState.vaso === 'low') score += 2;
    else {
      const map = parseFloat(sofaState.map);
      if (!isNaN(map) && map < 70) score += 1;
    }

    const gcs = sofaState.gcs;
    if (gcs < 6) score += 4;
    else if (gcs <= 9) score += 3;
    else if (gcs <= 12) score += 2;
    else if (gcs <= 14) score += 1;

    let creat = parseFloat(sofaState.creat);
    if (sofaState.creatUnit === 'umol/L') creat = creat / 88.4;
    const urine = parseFloat(sofaState.urine);
    
    if (!isNaN(urine) && urine < 200) score += 4;
    else if (!isNaN(creat) && creat > 5.0) score += 4;
    else if (!isNaN(urine) && urine < 500) score += 3;
    else if (!isNaN(creat) && creat >= 3.5) score += 3;
    else if (!isNaN(creat) && creat >= 2.0) score += 2;
    else if (!isNaN(creat) && creat >= 1.2) score += 1;

    return score;
  }, [sofaState]);

  const archbrResult = useMemo(() => {
    const major = archbrState.major.length;
    const minor = archbrState.minor.length;
    return major >= 1 || minor >= 2;
  }, [archbrState]);

  const score2Result = useMemo(() => {
    const age = parseFloat(score2State.age);
    const sbp = parseFloat(score2State.sysBp);
    let nonHdl = parseFloat(score2State.nonHdl);
    if (score2State.nonHdlUnit === 'mg/dL') nonHdl = nonHdl / 38.67;

    if (isNaN(age) || isNaN(sbp) || isNaN(nonHdl)) return null;
    if (age < 40 || age > 89) return 'N/A (Tuổi 40-89)';

    let risk = (age - 40) * 0.2 + (sbp - 120) * 0.05 + (nonHdl - 3.0) * 1.5;
    if (score2State.smoker) risk += 3;
    if (score2State.sex === 'male') risk += 2;

    if (score2State.region === 'low') risk *= 0.6;
    else if (score2State.region === 'high') risk *= 1.5;
    else if (score2State.region === 'very_high') risk *= 2.0;

    return Math.max(0.1, Math.min(99.9, risk)).toFixed(1) + '%';
  }, [score2State]);

  const score2DmResult = useMemo(() => {
    const age = parseFloat(score2DmState.age);
    const sbp = parseFloat(score2DmState.sysBp);
    let nonHdl = parseFloat(score2DmState.nonHdl);
    if (score2DmState.nonHdlUnit === 'mg/dL') nonHdl = nonHdl / 38.67;
    let hba1c = parseFloat(score2DmState.hba1c);
    if (score2DmState.hba1cUnit === '%') hba1c = (hba1c - 2.15) * 10.929;
    const egfr = parseFloat(score2DmState.egfr);
    const ageDm = parseFloat(score2DmState.ageDm);

    if (isNaN(age) || isNaN(sbp) || isNaN(nonHdl) || isNaN(hba1c) || isNaN(egfr) || isNaN(ageDm)) return null;

    let risk = (age - 40) * 0.25 + (sbp - 120) * 0.06 + (nonHdl - 3.0) * 1.6;
    if (score2DmState.smoker) risk += 3.5;
    if (score2DmState.sex === 'male') risk += 2.5;
    
    risk += (hba1c - 50) * 0.1;
    if (egfr < 60) risk += (60 - egfr) * 0.1;
    risk += Math.max(0, age - ageDm) * 0.1;

    if (score2DmState.region === 'low') risk *= 0.6;
    else if (score2DmState.region === 'high') risk *= 1.5;
    else if (score2DmState.region === 'very_high') risk *= 2.0;

    return Math.max(0.1, Math.min(99.9, risk)).toFixed(1) + '%';
  }, [score2DmState]);

  const preventResult = useMemo(() => {
    const age = parseFloat(preventState.age);
    let tc = parseFloat(preventState.tc);
    let hdl = parseFloat(preventState.hdl);
    if (preventState.unit === 'mmol/L') {
      tc = tc / 38.67;
      hdl = hdl / 38.67;
    }
    const sbp = parseFloat(preventState.sysBp);
    const egfr = parseFloat(preventState.egfr);

    if (isNaN(age) || isNaN(tc) || isNaN(hdl) || isNaN(sbp) || isNaN(egfr)) return null;

    let risk = (age - 30) * 0.15 + (tc - 150) * 0.02 - (hdl - 50) * 0.05 + (sbp - 120) * 0.05;
    if (egfr < 90) risk += (90 - egfr) * 0.05;
    if (preventState.smoker) risk += 4;
    if (preventState.diabetes) risk += 5;
    if (preventState.sex === 'male') risk += 3;
    if (preventState.statin) risk *= 0.75;
    if (preventState.antiHyp) risk *= 0.8;

    return Math.max(0.1, Math.min(99.9, risk)).toFixed(1) + '%';
  }, [preventState]);

  const egfrResult = useMemo(() => {
    const a = parseFloat(egfrState.age);
    let c = parseFloat(egfrState.creat);
    if (egfrState.unit === 'umol/L') c = c / 88.4;
    if (isNaN(a) || isNaN(c) || c === 0) return null;
    
    let k = egfrState.sex === 'female' ? 0.7 : 0.9;
    let alpha = egfrState.sex === 'female' ? -0.241 : -0.302;
    let min = Math.min(c / k, 1);
    let max = Math.max(c / k, 1);
    
    let res = 142 * Math.pow(min, alpha) * Math.pow(max, -1.200) * Math.pow(0.9938, a);
    if (egfrState.sex === 'female') res *= 1.012;
    return res.toFixed(1);
  }, [egfrState]);

  const childpughScore = useMemo(() => {
    let score = 0;
    let bili = parseFloat(childpughState.bili);
    if (childpughState.unit === 'umol/L') bili = bili / 17.1;
    const alb = parseFloat(childpughState.albumin);
    const inr = parseFloat(childpughState.inr);
    
    if (!isNaN(bili)) {
      if (bili < 2) score += 1;
      else if (bili <= 3) score += 2;
      else score += 3;
    }
    if (!isNaN(alb)) {
      if (alb > 3.5) score += 1;
      else if (alb >= 2.8) score += 2;
      else score += 3;
    }
    if (!isNaN(inr)) {
      if (inr < 1.7) score += 1;
      else if (inr <= 2.2) score += 2;
      else score += 3;
    }
    
    if (childpughState.ascites === 'none') score += 1;
    else if (childpughState.ascites === 'slight') score += 2;
    else if (childpughState.ascites === 'moderate') score += 3;
    
    if (childpughState.enceph === 'none') score += 1;
    else if (childpughState.enceph === 'grade12') score += 2;
    else if (childpughState.enceph === 'grade34') score += 3;
    
    return isNaN(bili) || isNaN(alb) || isNaN(inr) ? null : score;
  }, [childpughState]);

  const glasgowScore = useMemo(() => {
    return glasgowState.eye + glasgowState.verbal + glasgowState.motor;
  }, [glasgowState]);

  const curb65Score = useMemo(() => {
    return Object.values(curb65State).filter(Boolean).length;
  }, [curb65State]);

  const clcrResult = useMemo(() => {
    const a = parseFloat(clcrState.age);
    const w = parseFloat(clcrState.weight);
    let c = parseFloat(clcrState.creat);
    if (clcrState.unit === 'umol/L') c = c / 88.4;
    if (isNaN(a) || isNaN(w) || isNaN(c) || c === 0) return null;
    let res = ((140 - a) * w) / (72 * c);
    if (clcrState.sex === 'female') res *= 0.85;
    return res.toFixed(1);
  }, [clcrState]);

  const ldlcResult = useMemo(() => {
    const tc = parseFloat(ldlcState.tc);
    const hdl = parseFloat(ldlcState.hdl);
    const tg = parseFloat(ldlcState.tg);
    if (isNaN(tc) || isNaN(hdl) || isNaN(tg)) return null;
    
    if (ldlcState.unit === 'mmol/L') {
      if (tg >= 4.5) return 'N/A (TG ≥ 4.5)';
      return (tc - hdl - (tg / 2.2)).toFixed(2);
    } else {
      if (tg >= 400) return 'N/A (TG ≥ 400)';
      return (tc - hdl - (tg / 5)).toFixed(1);
    }
  }, [ldlcState]);

  const hasbledScore = useMemo(() => {
    return Object.values(hasbledState).filter(Boolean).length;
  }, [hasbledState]);

  const chaScore = useMemo(() => {
    let score = 0;
    if (chaState.heartFailure) score += 1;
    if (chaState.hypertension) score += 1;
    if (chaState.age === 'over75') score += 2;
    else if (chaState.age === '65to74') score += 1;
    if (chaState.diabetes) score += 1;
    if (chaState.stroke) score += 2;
    if (chaState.vascular) score += 1;
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

      {id === 'cha2ds2va' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">CHA₂DS₂-VA Score</CardTitle>
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
                
                <div className="grid grid-cols-1 gap-6 pt-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nhóm tuổi</Label>
                    <RadioGroup value={chaState.age} onValueChange={v => setChaState(s => ({ ...s, age: v as any }))} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {['under65', '65to74', 'over75'].map(a => (
                        <Label key={a} className={cn("flex items-center justify-center gap-3 p-2.5 border rounded-lg cursor-pointer text-xs font-bold transition-all", chaState.age === a ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100 hover:bg-slate-50")}>
                          <RadioGroupItem value={a} className="sr-only" />
                          {a === 'under65' ? '< 65 tuổi' : a === '65to74' ? '65 - 74 tuổi' : '≥ 75 tuổi'}
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
                    "{getRecommendation(chaScore)}"
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'zscore_hf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">Z-Score HF</CardTitle>
                <CardDescription>Tính toán Z-Score cho các chỉ số tim mạch trong suy tim.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giá trị đo được (Value)</Label>
                    <Input type="number" value={zState.value} onChange={e => setZState(s => ({ ...s, value: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giá trị trung bình (Mean)</Label>
                    <Input type="number" value={zState.mean} onChange={e => setZState(s => ({ ...s, mean: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Độ lệch chuẩn (SD)</Label>
                    <Input type="number" value={zState.sd} onChange={e => setZState(s => ({ ...s, sd: e.target.value }))} className="h-10 font-bold" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setZState({ value: '', mean: '', sd: '' })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Kết quả Z-Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-7xl font-black text-primary tracking-tighter">{zResult !== null ? zResult.toFixed(2) : '--'}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Độ lệch chuẩn</div>
              </CardContent>
            </Card>
            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Giải thích</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                  Z-score cho biết giá trị đo được nằm cách giá trị trung bình bao nhiêu độ lệch chuẩn. 
                  Trong tim mạch, Z-score thường được dùng để đánh giá kích thước các buồng tim và mạch máu.
                </p>
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
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cholesterol toàn phần</Label>
                      <button onClick={() => setAscvdState(s => ({ ...s, unit: s.unit === 'mg/dL' ? 'mmol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{ascvdState.unit}</button>
                    </div>
                    <Input type="number" value={ascvdState.totalChol} onChange={e => setAscvdState(s => ({ ...s, totalChol: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">HDL Cholesterol</Label>
                      <button onClick={() => setAscvdState(s => ({ ...s, unit: s.unit === 'mg/dL' ? 'mmol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{ascvdState.unit}</button>
                    </div>
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

      {id === 'clcr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">Creatinine Clearance (Cockcroft-Gault)</CardTitle>
                <CardDescription>Ước tính độ thanh thải Creatinine.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tuổi (năm)</Label>
                    <Input type="number" value={clcrState.age} onChange={e => setClcrState(s => ({ ...s, age: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cân nặng (kg)</Label>
                    <Input type="number" value={clcrState.weight} onChange={e => setClcrState(s => ({ ...s, weight: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Creatinine máu</Label>
                      <button onClick={() => setClcrState(s => ({ ...s, unit: s.unit === 'mg/dL' ? 'umol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{clcrState.unit === 'umol/L' ? 'µmol/L' : 'mg/dL'}</button>
                    </div>
                    <Input type="number" value={clcrState.creat} onChange={e => setClcrState(s => ({ ...s, creat: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giới tính</Label>
                    <RadioGroup value={clcrState.sex} onValueChange={v => setClcrState(s => ({ ...s, sex: v as any }))} className="flex gap-2">
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", clcrState.sex === 'male' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="male" className="sr-only" /> Nam
                      </Label>
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", clcrState.sex === 'female' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="female" className="sr-only" /> Nữ
                      </Label>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setClcrState({ age: '', weight: '', creat: '', sex: 'male' })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Độ thanh thải Creatinine</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-7xl font-black text-primary tracking-tighter">{clcrResult || '--'}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">mL/min</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'ldlc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">LDL-C (Friedewald)</CardTitle>
                <CardDescription>Tính toán LDL Cholesterol từ bộ mỡ máu.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Chol</Label>
                      <button onClick={() => setLdlcState(s => ({ ...s, unit: s.unit === 'mg/dL' ? 'mmol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{ldlcState.unit}</button>
                    </div>
                    <Input type="number" value={ldlcState.tc} onChange={e => setLdlcState(s => ({ ...s, tc: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">HDL</Label>
                      <button onClick={() => setLdlcState(s => ({ ...s, unit: s.unit === 'mg/dL' ? 'mmol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{ldlcState.unit}</button>
                    </div>
                    <Input type="number" value={ldlcState.hdl} onChange={e => setLdlcState(s => ({ ...s, hdl: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Triglycerides</Label>
                      <button onClick={() => setLdlcState(s => ({ ...s, unit: s.unit === 'mg/dL' ? 'mmol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{ldlcState.unit}</button>
                    </div>
                    <Input type="number" value={ldlcState.tg} onChange={e => setLdlcState(s => ({ ...s, tg: e.target.value }))} className="h-10 font-bold" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setLdlcState({ tc: '', hdl: '', tg: '' })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">LDL-C Ước tính</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-5xl md:text-7xl font-black text-primary tracking-tighter text-center">{ldlcResult || '--'}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">{ldlcState.unit}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'hasbled' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">HAS-BLED Score</CardTitle>
                <CardDescription>Đánh giá nguy cơ chảy máu ở bệnh nhân rung nhĩ.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {[
                  { id: 'htn', label: 'Hypertension', sub: 'Huyết áp tâm thu > 160 mmHg', key: 'htn' },
                  { id: 'renal', label: 'Abnormal Renal Function', sub: 'Chạy thận, ghép thận, Cr > 2.26 mg/dL', key: 'renal' },
                  { id: 'liver', label: 'Abnormal Liver Function', sub: 'Xơ gan, Bilirubin > 2x, AST/ALT > 3x', key: 'liver' },
                  { id: 'stroke', label: 'Stroke', sub: 'Tiền sử đột quỵ', key: 'stroke' },
                  { id: 'bleeding', label: 'Bleeding', sub: 'Tiền sử chảy máu hoặc yếu tố nguy cơ', key: 'bleeding' },
                  { id: 'labileInr', label: 'Labile INRs', sub: 'INR không ổn định/khó kiểm soát', key: 'labileInr' },
                  { id: 'elderly', label: 'Elderly', sub: 'Tuổi > 65', key: 'elderly' },
                  { id: 'drugs', label: 'Drugs', sub: 'Dùng thuốc chống viêm NSAID, kháng tiểu cầu', key: 'drugs' },
                  { id: 'alcohol', label: 'Alcohol', sub: 'Uống rượu > 8 ly/tuần', key: 'alcohol' },
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-primary/20 transition-colors">
                    <div className="space-y-0.5">
                      <Label htmlFor={item.id} className="text-sm font-bold cursor-pointer text-slate-700">{item.label}</Label>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.sub}</p>
                    </div>
                    <Checkbox 
                      id={item.id} 
                      checked={(hasbledState as any)[item.key]} 
                      onCheckedChange={(v) => setHasbledState(s => ({ ...s, [item.key]: !!v }))}
                      className="h-5 w-5"
                    />
                  </div>
                ))}
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setHasbledState({ htn: false, renal: false, liver: false, stroke: false, bleeding: false, labileInr: false, elderly: false, drugs: false, alcohol: false })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Điểm HAS-BLED</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-8xl font-black text-primary tracking-tighter">{hasbledScore}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Tổng điểm</div>
              </CardContent>
            </Card>
            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Đánh giá nguy cơ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">Mức độ</span>
                  <span className={cn(
                    "px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                    hasbledScore >= 3 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  )}>
                    {hasbledScore >= 3 ? "Nguy cơ cao" : "Nguy cơ thấp/trung bình"}
                  </span>
                </div>
                <Separator className="bg-slate-100" />
                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                  {hasbledScore >= 3 ? "Khuyến cáo: Cần theo dõi sát, đánh giá lại thường xuyên và điều chỉnh các yếu tố nguy cơ có thể thay đổi được." : "Khuyến cáo: Nguy cơ chảy máu thấp, có thể sử dụng thuốc chống đông an toàn."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'egfr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">eGFR (CKD-EPI 2021)</CardTitle>
                <CardDescription>Mức lọc cầu thận ước tính (không phân biệt chủng tộc).</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tuổi (năm)</Label>
                    <Input type="number" value={egfrState.age} onChange={e => setEgfrState(s => ({ ...s, age: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Creatinine máu</Label>
                      <button onClick={() => setEgfrState(s => ({ ...s, unit: s.unit === 'mg/dL' ? 'umol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{egfrState.unit === 'umol/L' ? 'µmol/L' : 'mg/dL'}</button>
                    </div>
                    <Input type="number" value={egfrState.creat} onChange={e => setEgfrState(s => ({ ...s, creat: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giới tính</Label>
                    <RadioGroup value={egfrState.sex} onValueChange={v => setEgfrState(s => ({ ...s, sex: v as any }))} className="flex gap-2">
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", egfrState.sex === 'male' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="male" className="sr-only" /> Nam
                      </Label>
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", egfrState.sex === 'female' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="female" className="sr-only" /> Nữ
                      </Label>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setEgfrState({ age: '', creat: '', sex: 'male' })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">eGFR</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-7xl font-black text-primary tracking-tighter">{egfrResult || '--'}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">mL/min/1.73m²</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'childpugh' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">Child-Pugh Score</CardTitle>
                <CardDescription>Đánh giá mức độ xơ gan và tiên lượng.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bilirubin toàn phần</Label>
                      <button onClick={() => setChildpughState(s => ({ ...s, unit: s.unit === 'mg/dL' ? 'umol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{childpughState.unit === 'umol/L' ? 'µmol/L' : 'mg/dL'}</button>
                    </div>
                    <Input type="number" value={childpughState.bili} onChange={e => setChildpughState(s => ({ ...s, bili: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Albumin máu (g/dL)</Label>
                    <Input type="number" value={childpughState.albumin} onChange={e => setChildpughState(s => ({ ...s, albumin: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">INR</Label>
                    <Input type="number" value={childpughState.inr} onChange={e => setChildpughState(s => ({ ...s, inr: e.target.value }))} className="h-10 font-bold" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Báng bụng (Ascites)</Label>
                  <RadioGroup value={childpughState.ascites} onValueChange={v => setChildpughState(s => ({ ...s, ascites: v as any }))} className="grid grid-cols-3 gap-2">
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", childpughState.ascites === 'none' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="none" className="sr-only" /> Không có
                    </Label>
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", childpughState.ascites === 'slight' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="slight" className="sr-only" /> Nhẹ/Vừa
                    </Label>
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", childpughState.ascites === 'moderate' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="moderate" className="sr-only" /> Nhiều
                    </Label>
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bệnh lý não gan</Label>
                  <RadioGroup value={childpughState.enceph} onValueChange={v => setChildpughState(s => ({ ...s, enceph: v as any }))} className="grid grid-cols-3 gap-2">
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", childpughState.enceph === 'none' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="none" className="sr-only" /> Không có
                    </Label>
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", childpughState.enceph === 'grade12' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="grade12" className="sr-only" /> Độ 1-2
                    </Label>
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", childpughState.enceph === 'grade34' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="grade34" className="sr-only" /> Độ 3-4
                    </Label>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setChildpughState({ bili: '', albumin: '', inr: '', ascites: 'none', enceph: 'none' })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Điểm Child-Pugh</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-8xl font-black text-primary tracking-tighter">{childpughScore || '--'}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Tổng điểm</div>
              </CardContent>
            </Card>
            {childpughScore !== null && (
              <Card className="clinical-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Phân loại</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-600">Child-Pugh Class</span>
                    <span className={cn(
                      "px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                      childpughScore <= 6 ? "bg-green-100 text-green-700" :
                      childpughScore <= 9 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    )}>
                      {childpughScore <= 6 ? "Class A" : childpughScore <= 9 ? "Class B" : "Class C"}
                    </span>
                  </div>
                  <Separator className="bg-slate-100" />
                  <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                    {childpughScore <= 6 ? "Tiên lượng tốt. Tỷ lệ sống 1 năm: 100%, 2 năm: 85%." :
                     childpughScore <= 9 ? "Tiên lượng trung bình. Tỷ lệ sống 1 năm: 81%, 2 năm: 57%." :
                     "Tiên lượng xấu. Tỷ lệ sống 1 năm: 45%, 2 năm: 35%."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {id === 'glasgow' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">Glasgow Coma Scale (GCS)</CardTitle>
                <CardDescription>Đánh giá mức độ ý thức.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mở mắt (Eye)</Label>
                  <RadioGroup value={glasgowState.eye.toString()} onValueChange={v => setGlasgowState(s => ({ ...s, eye: parseInt(v) }))} className="grid grid-cols-1 gap-2">
                    {[
                      { v: 4, l: 'Tự nhiên (4)' },
                      { v: 3, l: 'Khi gọi (3)' },
                      { v: 2, l: 'Khi kích thích đau (2)' },
                      { v: 1, l: 'Không mở mắt (1)' }
                    ].map(item => (
                      <Label key={item.v} className={cn("p-2.5 border rounded-lg cursor-pointer text-xs font-bold", glasgowState.eye === item.v ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value={item.v.toString()} className="sr-only" /> {item.l}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Đáp ứng lời nói (Verbal)</Label>
                  <RadioGroup value={glasgowState.verbal.toString()} onValueChange={v => setGlasgowState(s => ({ ...s, verbal: parseInt(v) }))} className="grid grid-cols-1 gap-2">
                    {[
                      { v: 5, l: 'Định hướng tốt (5)' },
                      { v: 4, l: 'Lú lẫn (4)' },
                      { v: 3, l: 'Trả lời không phù hợp (3)' },
                      { v: 2, l: 'Chỉ phát ra âm thanh (2)' },
                      { v: 1, l: 'Không đáp ứng (1)' }
                    ].map(item => (
                      <Label key={item.v} className={cn("p-2.5 border rounded-lg cursor-pointer text-xs font-bold", glasgowState.verbal === item.v ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value={item.v.toString()} className="sr-only" /> {item.l}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Đáp ứng vận động (Motor)</Label>
                  <RadioGroup value={glasgowState.motor.toString()} onValueChange={v => setGlasgowState(s => ({ ...s, motor: parseInt(v) }))} className="grid grid-cols-1 gap-2">
                    {[
                      { v: 6, l: 'Làm theo y lệnh (6)' },
                      { v: 5, l: 'Gạt đúng chỗ đau (5)' },
                      { v: 4, l: 'Rút chi khi đau (4)' },
                      { v: 3, l: 'Gấp cứng mất vỏ (3)' },
                      { v: 2, l: 'Duỗi cứng mất não (2)' },
                      { v: 1, l: 'Không đáp ứng (1)' }
                    ].map(item => (
                      <Label key={item.v} className={cn("p-2.5 border rounded-lg cursor-pointer text-xs font-bold", glasgowState.motor === item.v ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value={item.v.toString()} className="sr-only" /> {item.l}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setGlasgowState({ eye: 4, verbal: 5, motor: 6 })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Điểm GCS</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-8xl font-black text-primary tracking-tighter">{glasgowScore}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">E{glasgowState.eye} V{glasgowState.verbal} M{glasgowState.motor}</div>
              </CardContent>
            </Card>
            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Đánh giá</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">Mức độ</span>
                  <span className={cn(
                    "px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                    glasgowScore >= 13 ? "bg-green-100 text-green-700" :
                    glasgowScore >= 9 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  )}>
                    {glasgowScore >= 13 ? "Nhẹ" : glasgowScore >= 9 ? "Trung bình" : "Nặng"}
                  </span>
                </div>
                <Separator className="bg-slate-100" />
                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                  {glasgowScore <= 8 ? "Khuyến cáo: Cân nhắc đặt nội khí quản bảo vệ đường thở (GCS ≤ 8)." : "Theo dõi sát tri giác."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'curb65' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">CURB-65 Score</CardTitle>
                <CardDescription>Đánh giá mức độ nặng viêm phổi cộng đồng.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {[
                  { id: 'confusion', label: 'C - Confusion', sub: 'Lú lẫn mới xuất hiện', key: 'confusion' },
                  { id: 'urea', label: 'U - Urea', sub: 'BUN > 19 mg/dL (> 7 mmol/L)', key: 'urea' },
                  { id: 'resp', label: 'R - Respiratory Rate', sub: 'Nhịp thở ≥ 30 lần/phút', key: 'resp' },
                  { id: 'bp', label: 'B - Blood Pressure', sub: 'HA tâm thu < 90 hoặc tâm trương ≤ 60 mmHg', key: 'bp' },
                  { id: 'age', label: '65 - Age', sub: 'Tuổi ≥ 65', key: 'age' },
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:border-primary/20 transition-colors">
                    <div className="space-y-0.5">
                      <Label htmlFor={item.id} className="text-sm font-bold cursor-pointer text-slate-700">{item.label}</Label>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.sub}</p>
                    </div>
                    <Checkbox 
                      id={item.id} 
                      checked={(curb65State as any)[item.key]} 
                      onCheckedChange={(v) => setCurb65State(s => ({ ...s, [item.key]: !!v }))}
                      className="h-5 w-5"
                    />
                  </div>
                ))}
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurb65State({ confusion: false, urea: false, resp: false, bp: false, age: false })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Điểm CURB-65</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-8xl font-black text-primary tracking-tighter">{curb65Score}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Tổng điểm</div>
              </CardContent>
            </Card>
            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Khuyến cáo điều trị</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">Nơi điều trị</span>
                  <span className={cn(
                    "px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                    curb65Score <= 1 ? "bg-green-100 text-green-700" :
                    curb65Score === 2 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  )}>
                    {curb65Score <= 1 ? "Ngoại trú" : curb65Score === 2 ? "Nhập viện (Nội khoa)" : "Nhập viện (ICU)"}
                  </span>
                </div>
                <Separator className="bg-slate-100" />
                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                  {curb65Score <= 1 ? "Nguy cơ tử vong thấp (1.5%). Có thể điều trị ngoại trú." :
                   curb65Score === 2 ? "Nguy cơ tử vong trung bình (9.2%). Xem xét nhập viện điều trị ngắn ngày hoặc theo dõi sát ngoại trú." :
                   "Nguy cơ tử vong cao (22%). Nhập viện điều trị, xem xét nhập ICU đặc biệt nếu điểm 4-5."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'sofa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">SOFA Score</CardTitle>
                <CardDescription>Đánh giá suy đa tạng trong nhiễm trùng huyết.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 border-b pb-2">Hô hấp</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PaO2 (mmHg)</Label>
                      <Input type="number" value={sofaState.pao2} onChange={e => setSofaState(s => ({ ...s, pao2: e.target.value }))} className="h-10 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">FiO2 (%)</Label>
                      <Input type="number" value={sofaState.fio2} onChange={e => setSofaState(s => ({ ...s, fio2: e.target.value }))} className="h-10 font-bold" />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <Checkbox id="vent" checked={sofaState.vent} onCheckedChange={v => setSofaState(s => ({ ...s, vent: !!v }))} />
                      <Label htmlFor="vent" className="text-sm font-bold text-slate-600">Có thở máy hỗ trợ hô hấp</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 border-b pb-2">Đông máu & Gan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tiểu cầu (x10³/µL)</Label>
                      <Input type="number" value={sofaState.platelets} onChange={e => setSofaState(s => ({ ...s, platelets: e.target.value }))} className="h-10 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bilirubin</Label>
                        <button onClick={() => setSofaState(s => ({ ...s, biliUnit: s.biliUnit === 'mg/dL' ? 'umol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{sofaState.biliUnit === 'umol/L' ? 'µmol/L' : 'mg/dL'}</button>
                      </div>
                      <Input type="number" value={sofaState.bili} onChange={e => setSofaState(s => ({ ...s, bili: e.target.value }))} className="h-10 font-bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 border-b pb-2">Tim mạch</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Huyết áp trung bình (MAP mmHg)</Label>
                      <Input type="number" value={sofaState.map} onChange={e => setSofaState(s => ({ ...s, map: e.target.value }))} className="h-10 font-bold" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vận mạch</Label>
                      <RadioGroup value={sofaState.vaso} onValueChange={v => setSofaState(s => ({ ...s, vaso: v as any }))} className="grid grid-cols-1 gap-2">
                        <Label className={cn("p-2 border rounded-lg cursor-pointer text-xs font-bold", sofaState.vaso === 'none' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                          <RadioGroupItem value="none" className="sr-only" /> Không dùng
                        </Label>
                        <Label className={cn("p-2 border rounded-lg cursor-pointer text-xs font-bold", sofaState.vaso === 'low' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                          <RadioGroupItem value="low" className="sr-only" /> Dopamine ≤ 5 hoặc Dobutamine (mọi liều)
                        </Label>
                        <Label className={cn("p-2 border rounded-lg cursor-pointer text-xs font-bold", sofaState.vaso === 'med' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                          <RadioGroupItem value="med" className="sr-only" /> Dopa &gt; 5, Epi ≤ 0.1, Nor ≤ 0.1
                        </Label>
                        <Label className={cn("p-2 border rounded-lg cursor-pointer text-xs font-bold", sofaState.vaso === 'high' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                          <RadioGroupItem value="high" className="sr-only" /> Dopa &gt; 15, Epi &gt; 0.1, Nor &gt; 0.1
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 border-b pb-2">Thần kinh & Thận</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Điểm GCS</Label>
                      <Input type="number" value={sofaState.gcs} onChange={e => setSofaState(s => ({ ...s, gcs: parseInt(e.target.value) || 15 }))} className="h-10 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Creatinine</Label>
                        <button onClick={() => setSofaState(s => ({ ...s, creatUnit: s.creatUnit === 'mg/dL' ? 'umol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{sofaState.creatUnit === 'umol/L' ? 'µmol/L' : 'mg/dL'}</button>
                      </div>
                      <Input type="number" value={sofaState.creat} onChange={e => setSofaState(s => ({ ...s, creat: e.target.value }))} className="h-10 font-bold" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nước tiểu (mL/ngày) - Tùy chọn</Label>
                      <Input type="number" value={sofaState.urine} onChange={e => setSofaState(s => ({ ...s, urine: e.target.value }))} className="h-10 font-bold" />
                    </div>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setSofaState({ pao2: '', fio2: '', vent: false, platelets: '', bili: '', biliUnit: 'mg/dL', map: '', vaso: 'none', gcs: 15, creat: '', creatUnit: 'mg/dL', urine: '' })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Điểm SOFA</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-8xl font-black text-primary tracking-tighter">{sofaScore}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Tổng điểm</div>
              </CardContent>
            </Card>
            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Tiên lượng tử vong</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator className="bg-slate-100" />
                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                  {sofaScore <= 1 ? "Tử vong < 10%" :
                   sofaScore <= 3 ? "Tử vong ~ 10%" :
                   sofaScore <= 5 ? "Tử vong ~ 20%" :
                   sofaScore <= 7 ? "Tử vong ~ 30%" :
                   sofaScore <= 9 ? "Tử vong ~ 40%" :
                   sofaScore <= 11 ? "Tử vong ~ 50%" :
                   sofaScore <= 14 ? "Tử vong ~ 60%" : "Tử vong > 90%"}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed font-medium mt-2">
                  * SOFA tăng ≥ 2 điểm so với nền phản ánh rối loạn chức năng cơ quan cấp tính (tiêu chuẩn Sepsis-3).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'arc_hbr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">ARC-HBR</CardTitle>
                <CardDescription>Đánh giá nguy cơ chảy máu cao (High Bleeding Risk).</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 border-b pb-2">Tiêu chuẩn chính (Major Criteria)</h4>
                  {[
                    { id: 'm1', label: 'Dự kiến dùng kháng đông dài hạn' },
                    { id: 'm2', label: 'Bệnh thận mạn nặng (eGFR < 30)' },
                    { id: 'm3', label: 'Hb < 11 g/dL' },
                    { id: 'm4', label: 'Chảy máu tự phát cần nhập viện/truyền máu (trong 6 tháng)' },
                    { id: 'm5', label: 'Giảm tiểu cầu trung bình/nặng (< 100k)' },
                    { id: 'm6', label: 'Tạng chảy máu mạn tính' },
                    { id: 'm7', label: 'Xơ gan kèm tăng áp TM cửa' },
                    { id: 'm8', label: 'Bệnh lý ác tính đang hoạt động' },
                    { id: 'm9', label: 'Chảy máu nội sọ tự phát trước đây' },
                    { id: 'm10', label: 'Chấn thương sọ não/Phẫu thuật thần kinh gần đây' },
                    { id: 'm11', label: 'Dị dạng mạch máu não' },
                    { id: 'm12', label: 'Đột quỵ thiếu máu não vừa/nặng (trong 6 tháng)' },
                    { id: 'm13', label: 'Phẫu thuật lớn/Chấn thương gần đây (trong 30 ngày)' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                      <Checkbox 
                        id={item.id} 
                        checked={archbrState.major.includes(item.id)}
                        onCheckedChange={(v) => {
                          if (v) setArchbrState(s => ({ ...s, major: [...s.major, item.id] }));
                          else setArchbrState(s => ({ ...s, major: s.major.filter(i => i !== item.id) }));
                        }}
                      />
                      <Label htmlFor={item.id} className="text-sm cursor-pointer text-slate-700">{item.label}</Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 border-b pb-2">Tiêu chuẩn phụ (Minor Criteria)</h4>
                  {[
                    { id: 'mi1', label: 'Tuổi ≥ 75' },
                    { id: 'mi2', label: 'Bệnh thận mạn trung bình (eGFR 30-59)' },
                    { id: 'mi3', label: 'Hb 11 - 12.9 g/dL (Nam) hoặc 11 - 11.9 g/dL (Nữ)' },
                    { id: 'mi4', label: 'Chảy máu tự phát cần nhập viện/truyền máu (trước 6 tháng)' },
                    { id: 'mi5', label: 'Dùng NSAID hoặc Steroid dài hạn' },
                    { id: 'mi6', label: 'Đột quỵ thiếu máu não (trước 6 tháng)' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
                      <Checkbox 
                        id={item.id} 
                        checked={archbrState.minor.includes(item.id)}
                        onCheckedChange={(v) => {
                          if (v) setArchbrState(s => ({ ...s, minor: [...s.minor, item.id] }));
                          else setArchbrState(s => ({ ...s, minor: s.minor.filter(i => i !== item.id) }));
                        }}
                      />
                      <Label htmlFor={item.id} className="text-sm cursor-pointer text-slate-700">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setArchbrState({ major: [], minor: [] })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Đánh giá ARC-HBR</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-3xl font-black text-primary tracking-tighter text-center">
                  {archbrResult ? "Nguy cơ chảy máu CAO" : "Nguy cơ chảy máu THẤP"}
                </div>
                <div className="mt-4 text-sm font-bold text-slate-600 uppercase tracking-widest">
                  {archbrState.major.length} Tiêu chuẩn chính | {archbrState.minor.length} Tiêu chuẩn phụ
                </div>
              </CardContent>
            </Card>
            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Tiêu chuẩn chẩn đoán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator className="bg-slate-100" />
                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                  Bệnh nhân được coi là có nguy cơ chảy máu cao (HBR) nếu có ít nhất <strong>1 tiêu chuẩn chính (Major)</strong> HOẶC <strong>2 tiêu chuẩn phụ (Minor)</strong>.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                  Khuyến cáo: Cân nhắc rút ngắn thời gian dùng kháng tiểu cầu kép (DAPT) ở bệnh nhân HBR sau can thiệp mạch vành.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'score2' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">SCORE2</CardTitle>
                <CardDescription>Nguy cơ tim mạch 10 năm (Châu Âu).</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tuổi (40-89)</Label>
                    <Input type="number" value={score2State.age} onChange={e => setScore2State(s => ({ ...s, age: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Huyết áp tâm thu (mmHg)</Label>
                    <Input type="number" value={score2State.sysBp} onChange={e => setScore2State(s => ({ ...s, sysBp: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Non-HDL Cholesterol</Label>
                      <button onClick={() => setScore2State(s => ({ ...s, nonHdlUnit: s.nonHdlUnit === 'mg/dL' ? 'mmol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{score2State.nonHdlUnit}</button>
                    </div>
                    <Input type="number" value={score2State.nonHdl} onChange={e => setScore2State(s => ({ ...s, nonHdl: e.target.value }))} className="h-10 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giới tính</Label>
                    <RadioGroup value={score2State.sex} onValueChange={v => setScore2State(s => ({ ...s, sex: v as any }))} className="flex gap-2">
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2State.sex === 'male' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="male" className="sr-only" /> Nam
                      </Label>
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2State.sex === 'female' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="female" className="sr-only" /> Nữ
                      </Label>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hút thuốc</Label>
                    <RadioGroup value={score2State.smoker ? 'yes' : 'no'} onValueChange={v => setScore2State(s => ({ ...s, smoker: v === 'yes' }))} className="flex gap-2">
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2State.smoker ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="yes" className="sr-only" /> Có
                      </Label>
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", !score2State.smoker ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="no" className="sr-only" /> Không
                      </Label>
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vùng nguy cơ (Region)</Label>
                  <RadioGroup value={score2State.region} onValueChange={v => setScore2State(s => ({ ...s, region: v as any }))} className="grid grid-cols-2 gap-2">
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2State.region === 'low' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="low" className="sr-only" /> Thấp
                    </Label>
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2State.region === 'moderate' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="moderate" className="sr-only" /> Trung bình
                    </Label>
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2State.region === 'high' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="high" className="sr-only" /> Cao
                    </Label>
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2State.region === 'very_high' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="very_high" className="sr-only" /> Rất cao
                    </Label>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setScore2State({ age: '', sex: 'male', smoker: false, sysBp: '', nonHdl: '', nonHdlUnit: 'mmol/L', region: 'moderate' })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Nguy cơ 10 năm</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-7xl font-black text-primary tracking-tighter">{score2Result || '--'}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Xác suất biến cố</div>
              </CardContent>
            </Card>
            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Lưu ý</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                  * Kết quả mang tính ước lượng tương đối dựa trên thuật toán mô phỏng. Vui lòng tham khảo bảng điểm SCORE2 chính thức từ ESC 2021.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'score2_diabetes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">SCORE2-Diabetes</CardTitle>
                <CardDescription>Nguy cơ tim mạch 10 năm ở bệnh nhân Đái tháo đường.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tuổi (40-89)</Label>
                    <Input type="number" value={score2DmState.age} onChange={e => setScore2DmState(s => ({ ...s, age: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tuổi chẩn đoán ĐTĐ</Label>
                    <Input type="number" value={score2DmState.ageDm} onChange={e => setScore2DmState(s => ({ ...s, ageDm: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Huyết áp tâm thu (mmHg)</Label>
                    <Input type="number" value={score2DmState.sysBp} onChange={e => setScore2DmState(s => ({ ...s, sysBp: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">eGFR (mL/min/1.73m²)</Label>
                    <Input type="number" value={score2DmState.egfr} onChange={e => setScore2DmState(s => ({ ...s, egfr: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Non-HDL Chol</Label>
                      <button onClick={() => setScore2DmState(s => ({ ...s, nonHdlUnit: s.nonHdlUnit === 'mg/dL' ? 'mmol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{score2DmState.nonHdlUnit}</button>
                    </div>
                    <Input type="number" value={score2DmState.nonHdl} onChange={e => setScore2DmState(s => ({ ...s, nonHdl: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">HbA1c</Label>
                      <button onClick={() => setScore2DmState(s => ({ ...s, hba1cUnit: s.hba1cUnit === '%' ? 'mmol/mol' : '%' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{score2DmState.hba1cUnit}</button>
                    </div>
                    <Input type="number" value={score2DmState.hba1c} onChange={e => setScore2DmState(s => ({ ...s, hba1c: e.target.value }))} className="h-10 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giới tính</Label>
                    <RadioGroup value={score2DmState.sex} onValueChange={v => setScore2DmState(s => ({ ...s, sex: v as any }))} className="flex gap-2">
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2DmState.sex === 'male' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="male" className="sr-only" /> Nam
                      </Label>
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2DmState.sex === 'female' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="female" className="sr-only" /> Nữ
                      </Label>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hút thuốc</Label>
                    <RadioGroup value={score2DmState.smoker ? 'yes' : 'no'} onValueChange={v => setScore2DmState(s => ({ ...s, smoker: v === 'yes' }))} className="flex gap-2">
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2DmState.smoker ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="yes" className="sr-only" /> Có
                      </Label>
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", !score2DmState.smoker ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="no" className="sr-only" /> Không
                      </Label>
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vùng nguy cơ (Region)</Label>
                  <RadioGroup value={score2DmState.region} onValueChange={v => setScore2DmState(s => ({ ...s, region: v as any }))} className="grid grid-cols-2 gap-2">
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2DmState.region === 'low' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="low" className="sr-only" /> Thấp
                    </Label>
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2DmState.region === 'moderate' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="moderate" className="sr-only" /> Trung bình
                    </Label>
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2DmState.region === 'high' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="high" className="sr-only" /> Cao
                    </Label>
                    <Label className={cn("p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", score2DmState.region === 'very_high' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                      <RadioGroupItem value="very_high" className="sr-only" /> Rất cao
                    </Label>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setScore2DmState({ age: '', sex: 'male', smoker: false, sysBp: '', nonHdl: '', nonHdlUnit: 'mmol/L', hba1c: '', hba1cUnit: '%', egfr: '', ageDm: '', region: 'moderate' })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Nguy cơ 10 năm</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-7xl font-black text-primary tracking-tighter">{score2DmResult || '--'}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Xác suất biến cố</div>
              </CardContent>
            </Card>
            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Lưu ý</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                  * Kết quả mang tính ước lượng tương đối dựa trên thuật toán mô phỏng. Vui lòng tham khảo bảng điểm SCORE2-Diabetes chính thức từ ESC 2023.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id === 'prevent' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="clinical-card">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-xl text-slate-800">PREVENT Risk Calculator</CardTitle>
                <CardDescription>AHA/ACC PREVENT Risk Calculator (Mô phỏng).</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tuổi (30-79)</Label>
                    <Input type="number" value={preventState.age} onChange={e => setPreventState(s => ({ ...s, age: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Huyết áp tâm thu (mmHg)</Label>
                    <Input type="number" value={preventState.sysBp} onChange={e => setPreventState(s => ({ ...s, sysBp: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Chol</Label>
                      <button onClick={() => setPreventState(s => ({ ...s, unit: s.unit === 'mg/dL' ? 'mmol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{preventState.unit}</button>
                    </div>
                    <Input type="number" value={preventState.tc} onChange={e => setPreventState(s => ({ ...s, tc: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">HDL Chol</Label>
                      <button onClick={() => setPreventState(s => ({ ...s, unit: s.unit === 'mg/dL' ? 'mmol/L' : 'mg/dL' }))} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{preventState.unit}</button>
                    </div>
                    <Input type="number" value={preventState.hdl} onChange={e => setPreventState(s => ({ ...s, hdl: e.target.value }))} className="h-10 font-bold" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">eGFR (mL/min/1.73m²)</Label>
                    <Input type="number" value={preventState.egfr} onChange={e => setPreventState(s => ({ ...s, egfr: e.target.value }))} className="h-10 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Giới tính</Label>
                    <RadioGroup value={preventState.sex} onValueChange={v => setPreventState(s => ({ ...s, sex: v as any }))} className="flex gap-2">
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", preventState.sex === 'male' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="male" className="sr-only" /> Nam
                      </Label>
                      <Label className={cn("flex-1 p-2 border rounded-lg text-center cursor-pointer text-xs font-bold", preventState.sex === 'female' ? "bg-primary/5 border-primary text-primary" : "bg-white border-slate-100")}>
                        <RadioGroupItem value="female" className="sr-only" /> Nữ
                      </Label>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'dm', label: 'Tiểu đường', key: 'diabetes' },
                    { id: 'sm', label: 'Hút thuốc', key: 'smoker' },
                    { id: 'st', label: 'Đang dùng Statin', key: 'statin' },
                    { id: 'ht', label: 'Điều trị HA', key: 'antiHyp' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/30">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</Label>
                      <Checkbox checked={(preventState as any)[item.key]} onCheckedChange={v => setPreventState(s => ({ ...s, [item.key]: !!v }))} />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setPreventState({ age: '', sex: 'male', tc: '', hdl: '', unit: 'mg/dL', sysBp: '', egfr: '', smoker: false, diabetes: false, statin: false, antiHyp: false })} className="h-8 text-xs font-bold">
                  <RefreshCcw size={12} className="mr-2" /> Làm mới
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Card className="clinical-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Nguy cơ 10 năm</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-7xl font-black text-primary tracking-tighter">{preventResult || '--'}</div>
                <div className="mt-2 text-sm font-bold text-slate-600 uppercase tracking-widest">Xác suất biến cố</div>
              </CardContent>
            </Card>
            <Card className="clinical-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Lưu ý</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                  * Kết quả mang tính ước lượng tương đối dựa trên thuật toán mô phỏng. Vui lòng tham khảo công cụ PREVENT chính thức từ AHA/ACC.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {id !== 'cha2ds2va' && id !== 'ascvd' && id !== 'clcr' && id !== 'egfr' && id !== 'childpugh' && id !== 'ldlc' && id !== 'hasbled' && id !== 'glasgow' && id !== 'curb65' && id !== 'sofa' && id !== 'arc_hbr' && id !== 'score2' && id !== 'score2_diabetes' && id !== 'prevent' && id !== 'zscore_hf' && (
        <div className="max-w-2xl mx-auto mt-12">
          <Card className="clinical-card border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                <Activity size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">Công cụ đang được cập nhật</h3>
              <p className="text-slate-500 text-sm max-w-md leading-relaxed">
                Thuật toán cho công cụ này đang được lập trình và kiểm thử để đảm bảo độ chính xác y khoa cao nhất.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Info size={14} /> Tham khảo MDCalc
              </div>
            </CardContent>
          </Card>
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
        <Route path="guidelines" element={<GuidelinesPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="viewer" element={<ViewerPage />} />
      </Route>
    </Routes>
  );
}
