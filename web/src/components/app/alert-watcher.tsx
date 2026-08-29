"use client";

import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/toast";
import { initAlertSoundUnlock, playAlertSound } from "@/lib/alert-sound";
import { api } from "../../../convex/_generated/api";

const alertTypeLabel: Record<string, string> = {
  overheat: "Sobrecalentamiento",
  battery_undercharge: "Batería baja",
  battery_overcharge: "Sobrecarga",
  check_engine: "Check engine",
};

// Escucha alertas activas y dispara un toast + sonido apenas aparece una NUEVA
// (no en la carga inicial — solo alertas que se disparan mientras la consola
// está abierta). Sin UI propia: se monta una vez en el shell autenticado.
export function AlertWatcher() {
  const alerts = useQuery(api.alerts.active);
  const devices = useQuery(api.devices.list);
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    initAlertSoundUnlock();
  }, []);

  useEffect(() => {
    if (alerts === undefined) return;

    if (seenIds.current === null) {
      // primera carga: registrar lo que ya estaba activo, sin notificar
      seenIds.current = new Set(alerts.map((a) => a._id));
      return;
    }

    const fresh = alerts.filter((a) => !seenIds.current?.has(a._id));
    for (const a of alerts) seenIds.current.add(a._id);

    for (const a of fresh) {
      const device = devices?.find((d) => d._id === a.deviceId);
      toast.add({
        title: a.severity === "critical" ? "Alerta crítica" : "Nueva alerta",
        description: `${device?.label ?? a.deviceId} — ${alertTypeLabel[a.type] ?? a.type}: ${a.message}`,
        type: "error",
      });
    }
    if (fresh.length > 0) playAlertSound();
  }, [alerts, devices]);

  return null;
}
