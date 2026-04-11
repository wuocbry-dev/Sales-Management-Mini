import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  Headphones,
  Layers,
  Quote,
  Shield,
  Smartphone,
  Sparkles,
  Store,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

const coreFeatures = [
  {
    title: "Đa cửa hàng & chi nhánh",
    desc: "Phân tách dữ liệu theo cửa hàng và chi nhánh, đồng thời giữ báo cáo tổng hợp cho lãnh đạo.",
    icon: Building2,
  },
  {
    title: "Hàng hóa & tồn kho",
    desc: "Sản phẩm nhiều biến thể, tồn theo kho, theo dõi nhập — xuất — chuyển — kiểm kê minh bạch.",
    icon: Boxes,
  },
  {
    title: "Bán hàng & đơn hàng",
    desc: "Quản lý đơn bán, trả hàng và trạng thái nghiệp vụ rõ ràng, phù hợp quy trình thực tế tại quầy.",
    icon: Truck,
  },
  {
    title: "Báo cáo & điều hành",
    desc: "Tổng quan doanh thu, đơn hàng và khách hàng giúp ra quyết định nhanh trong ngày.",
    icon: BarChart3,
  },
  {
    title: "Bảo mật & phân quyền",
    desc: "Vai trò và quyền chi tiết, phù hợp tổ chức nhiều cấp từ trụ sở đến cửa hàng.",
    icon: Shield,
  },
  {
    title: "Đồng hành triển khai",
    desc: "Hỗ trợ thiết lập quy trình, phân vai nhân viên và làm quen giao diện quản trị.",
    icon: Headphones,
  },
];

const industries = [
  {
    title: "Bán lẻ thời trang & phụ kiện",
    desc: "Quản nhiều mã và màu, đổi trả có kiểm soát, bán chéo giữa các điểm bán trong chuỗi.",
    icon: Store,
  },
  {
    title: "Hàng tiêu dùng & tạp hóa",
    desc: "Tốc độ thao tác cao tại quầy, cảnh báo tồn thấp và gợi ý nhập hàng theo từng kho.",
    icon: Layers,
  },
  {
    title: "Đại lý & phân phối nhỏ",
    desc: "Theo dõi công nợ khách hàng, đơn giao hàng và tồn kho theo từng khu vực phụ trách.",
    icon: Users,
  },
];

const chainBenefits = [
  "Một tài khoản quản trị có thể nhìn toàn chuỗi, trong khi nhân viên cửa hàng chỉ thao tác phạm vi được giao.",
  "Kho trung chuyển và kho cửa hàng tách bạch, giảm nhầm lẫn khi chuyển hàng nội bộ.",
  "Chi nhánh giúp gom dữ liệu theo vùng miền hoặc theo mô hình nhượng quyền.",
  "Báo cáo gộp hoặc theo cửa hàng giúp đánh giá hiệu suất từng điểm bán.",
];

const highlights = [
  "Giao diện quản trị gọn, tập trung vào việc cần làm mỗi ngày.",
  "Biểu đồ và thẻ chỉ số dễ đọc, hỗ trợ họp giao ban nhanh.",
  "Luồng nghiệp vụ rõ ràng: nhập hàng, bán, trả, kiểm kê, chuyển kho.",
  "Phân quyền chi tiết theo vai trò thực tế trong cửa hàng.",
];

const testimonials = [
  {
    quote:
      "Chúng tôi mở thêm hai điểm bán trong quý mà vẫn kiểm soát được tồn kho nhờ phân kho và phân quyền rõ ràng.",
    role: "Giám đốc vận hành — chuỗi năm cửa hàng thời trang",
  },
  {
    quote:
      "Báo cáo cuối ngày giúp tôi xem nhanh doanh thu và đơn hoàn tất, không cần ghép bảng thủ công.",
    role: "Chủ cửa hàng — khu vực đông khách lượt",
  },
  {
    quote:
      "Nhân viên thu ngân làm quen trong một buổi vì thao tác bán và trả hàng thống nhất trên một hệ thống.",
    role: "Quản lý cửa hàng — ngành hàng tiêu dùng",
  },
];

export function LandingPage() {
  return (
    <div className="flex flex-col">
      <section
        id="gioi-thieu"
        className="border-b bg-gradient-to-b from-primary/12 via-background to-background"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:py-24">
          <div className="flex-1 space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Nền tảng quản lý bán lẻ hiện đại
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Điều hành chuỗi cửa hàng <span className="text-primary">một cách tập trung</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Giải pháp quản trị bán hàng, kho và khách hàng với giao diện chuyên nghiệp, phù hợp doanh nghiệp đang mở
              rộng quy mô.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/register">Dùng thử miễn phí</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Đăng nhập quản trị</Link>
              </Button>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4 shrink-0" aria-hidden />
              Tối ưu cho máy tính và máy tính bảng tại quầy bán
            </p>
          </div>
          <Card className="flex-1 border-muted shadow-xl lg:max-w-md">
            <CardHeader>
              <CardTitle className="text-base text-primary">Tổng quan điều hành</CardTitle>
              <CardDescription>Thông tin phân tầng, dễ theo dõi trong buổi làm việc</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Doanh thu hôm nay</span>
                  <span className="rounded bg-primary/15 px-2 py-0.5 text-primary">Ví dụ hiển thị</span>
                </div>
                <div className="h-3 w-2/3 rounded bg-primary/25" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="h-16 rounded-md bg-gradient-to-br from-primary/25 to-background" />
                  <div className="h-16 rounded-md bg-muted" />
                  <div className="h-16 rounded-md bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="gia-tri" className="border-b bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Giá trị mang lại cho doanh nghiệp</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Giảm thao tác thủ công, tăng độ minh bạch giữa trụ sở và cửa hàng, giúp đội ngũ tập trung phục vụ khách
              thay vì đối chiếu sổ sách.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { t: "Tốc độ ra quyết định", d: "Chỉ số tổng hợp theo thời gian thực, hỗ trợ điều phối nhập hàng và nhân sự." },
              { t: "Kiểm soát rủi ro", d: "Phân quyền theo vai trò, giảm sai sót khi nhiều người cùng thao tác dữ liệu." },
              { t: "Mở rộng bền vững", d: "Mô hình đa cửa hàng và đa kho được thiết kế từ đầu, không phải vá víu sau này." },
            ].map((x) => (
              <Card key={x.t} className="border-muted/80 bg-background/80">
                <CardHeader>
                  <CheckCircle2 className="mb-2 h-8 w-8 text-primary" aria-hidden />
                  <CardTitle className="text-lg">{x.t}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{x.d}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="linh-vuc" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">Phù hợp nhiều mô hình kinh doanh</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Linh hoạt theo quy mô: từ cửa hàng đơn lẻ đến chuỗi có trụ sở điều hành trung tâm.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {industries.map((b) => (
            <Card key={b.title} className="border-muted/80">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">{b.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{b.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="cong-cu" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">Công cụ cốt lõi</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Một nền tảng cho đội ngũ bán hàng, kho và quản lý — thiết kế theo thói quen làm việc thực tế tại cửa hàng.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((f) => (
            <Card key={f.title} className="border-muted/80">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="tinh-nang" className="border-y bg-muted/15 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Điểm nổi bật trên giao diện</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Thiết kế theo hướng B2B: dữ liệu dày đặc nhưng vẫn dễ quét mắt trong ca làm việc dài.
          </p>
          <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {highlights.map((text) => (
              <li key={text} className="flex gap-3 rounded-lg border bg-background p-4 text-sm leading-relaxed shadow-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="chuoi-cua-hang" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Đa cửa hàng, chi nhánh và kho</h2>
            <p className="mt-4 text-muted-foreground">
              Khi số lượng điểm bán tăng, việc phân tách tồn kho và quyền truy cập trở thành yếu tố sống còn. Nền tảng
              hướng tới mô hình tập trung dữ liệu nhưng phân quyền thao tác rõ ràng từng lớp.
            </p>
            <ul className="mt-6 space-y-3">
              {chainBenefits.map((line) => (
                <li key={line} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <Warehouse className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="border-muted shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Sơ đồ minh họa vận hành</CardTitle>
              <CardDescription>Trụ sở — chi nhánh — cửa hàng — kho</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 text-sm font-medium text-primary">Trụ sở điều hành</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-background p-3 text-sm">Chi nhánh khu vực</div>
                <div className="rounded-lg border bg-background p-3 text-sm">Chi nhánh trung tâm</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border bg-muted/50 p-2 text-center text-xs">Cửa hàng A</div>
                <div className="rounded-md border bg-muted/50 p-2 text-center text-xs">Cửa hàng B</div>
                <div className="rounded-md border bg-muted/50 p-2 text-center text-xs">Kho nội bộ</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="phan-hoi" className="border-t bg-gradient-to-b from-muted/30 to-background py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Phản hồi từ đội ngũ vận hành</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
            Trích ý kiến minh họa từ các nhóm người dùng tương đương mục tiêu của sản phẩm — không gắn với cá nhân cụ
            thể ngoài thực tế.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="relative border-muted/80 bg-card/80">
                <CardHeader>
                  <Quote className="mb-2 h-8 w-8 text-primary/40" aria-hidden />
                  <p className="text-sm leading-relaxed text-foreground/90">«{t.quote}»</p>
                  <CardDescription className="pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.role}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="bat-dau" className="border-t bg-primary py-16 text-primary-foreground sm:py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Sẵn sàng gọn gàng hơn cho ca bán hàng tiếp theo?</h2>
          <p className="max-w-2xl text-sm text-primary-foreground/90 sm:text-base">
            Tạo tài khoản hoặc đăng nhập để vào phần quản trị. Giao diện quản lý được xây dựng theo luồng nghiệp vụ
            thực tế, không dừng lại ở trang giới thiệu tĩnh.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Tạo tài khoản</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/login">Đã có tài khoản — đăng nhập</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <div>
            <p className="font-semibold text-foreground">Bán hàng Pro</p>
            <p className="mt-1">Giải pháp quản lý bán lẻ cho đội ngũ đang phát triển.</p>
          </div>
          <p>© {new Date().getFullYear()} Bán hàng Pro. Mọi quyền được lưu giữ.</p>
        </div>
      </footer>
    </div>
  );
}
