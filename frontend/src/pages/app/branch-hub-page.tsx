import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export function BranchHubPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">Chọn cửa hàng</CardTitle>
        </div>
        <CardDescription>
          Danh sách chi nhánh theo từng cửa hàng. Hãy mở cửa hàng cần làm việc, sau đó vào mục chi nhánh trong trang chi
          tiết cửa hàng.
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
