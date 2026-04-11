import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive } from "lucide-react";

export function WarehouseHubPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Chọn cửa hàng</CardTitle>
        </div>
        <CardDescription>
          Kho được quản lý theo từng cửa hàng. Mở cửa hàng cần xem, rồi chọn mục kho hàng trong trang chi tiết cửa hàng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to="/app/cua-hang">Đi tới danh sách cửa hàng</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
