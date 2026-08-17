import AdminShell from "../components/AdminShell";
import { Home } from "../pages/home-sections";

export default function HomeSectionsPage() {
  return (
    <AdminShell
      title="Home Page Builder"
      subtitle="Customize home sections, banners, offers, colors, and drag to reorder"
    >
      <Home />
    </AdminShell>
  );
}
