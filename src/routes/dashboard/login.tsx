import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Masuk Agen — KerjaDekat" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [phone, setPhone] = useState("+62 812-2233-4455");
  const [otp, setOtp] = useState("123456");
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-canvas-soft">
      <div className="hidden lg:flex flex-col justify-between p-12">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground font-black">
            K
          </div>
          <span className="font-bold text-lg">KerjaDekat</span>
        </Link>
        <div>
          <h2 className="text-4xl font-black tracking-tight max-w-md leading-[1.05]">
            Berdayakan tetangga, bangun ekonomi RW.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            Dashboard Agen Komunitas untuk verifikasi pekerja, pantau order, dan
            laporkan kinerja kelurahan Anda.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© KerjaDekat 2025</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">Masuk sebagai Agen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gunakan nomor terdaftar dari koordinator wilayah.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              login(phone);
              navigate({ to: "/dashboard" });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Kode OTP (demo: 123456)</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-12 rounded-xl tracking-widest"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold"
            >
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
