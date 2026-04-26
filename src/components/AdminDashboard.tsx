"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CircleDollarSign, ListChecks, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type BookingRow = {
  id: string;
  created_at: string;
  property_name: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_email: string;
  total_price: number;
};

export function AdminDashboard() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalRevenue = useMemo(
    () => bookings.reduce((sum, booking) => sum + Number(booking.total_price ?? 0), 0),
    [bookings]
  );

  const currentMonthRevenue = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((booking) => {
        const created = parseISO(booking.created_at);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      })
      .reduce((sum, booking) => sum + Number(booking.total_price ?? 0), 0);
  }, [bookings]);

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("bookings")
        .select("id, created_at, property_name, check_in, check_out, guest_name, guest_email, total_price")
        .order("created_at", { ascending: false });

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setBookings((data as BookingRow[]) ?? []);
      setLoading(false);
    }

    void loadBookings();
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-brand-900 md:text-3xl">Panel właściciela</h1>
              <p className="mt-1 text-sm text-slate-500">Rezerwacje i statystyki zysków z Supabase.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={16} />
              Wyloguj
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
            <p className="text-xs uppercase tracking-wide text-slate-500">Liczba rezerwacji</p>
            <div className="mt-2 flex items-center gap-2 text-brand-800">
              <ListChecks size={18} />
              <p className="text-2xl font-semibold">{bookings.length}</p>
            </div>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
            <p className="text-xs uppercase tracking-wide text-slate-500">Laczny zysk</p>
            <div className="mt-2 flex items-center gap-2 text-brand-800">
              <CircleDollarSign size={18} />
              <p className="text-2xl font-semibold">{totalRevenue.toFixed(2)} zl</p>
            </div>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
            <p className="text-xs uppercase tracking-wide text-slate-500">Zysk w tym miesiacu</p>
            <div className="mt-2 flex items-center gap-2 text-brand-800">
              <CircleDollarSign size={18} />
              <p className="text-2xl font-semibold">{currentMonthRevenue.toFixed(2)} zl</p>
            </div>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-100">
          <h2 className="mb-4 text-lg font-semibold text-brand-900">Wszystkie rezerwacje</h2>
          {loading && <p className="text-sm text-slate-500">Ladowanie danych...</p>}
          {error && <p className="text-sm text-rose-600">Blad pobierania: {error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Obiekt</th>
                    <th className="px-3 py-2">Gosc</th>
                    <th className="px-3 py-2">Termin</th>
                    <th className="px-3 py-2">Cena</th>
                    <th className="px-3 py-2">Utworzono</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="rounded-xl bg-slate-50">
                      <td className="rounded-l-xl px-3 py-3 font-medium">{booking.property_name}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium">{booking.guest_name}</div>
                        <div className="text-xs text-slate-500">{booking.guest_email}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {format(parseISO(booking.check_in), "dd.MM.yyyy")} -{" "}
                        {format(parseISO(booking.check_out), "dd.MM.yyyy")}
                      </td>
                      <td className="px-3 py-3 font-medium text-brand-800">{Number(booking.total_price).toFixed(2)} zl</td>
                      <td className="rounded-r-xl px-3 py-3 text-slate-500">
                        {format(parseISO(booking.created_at), "dd.MM.yyyy HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
