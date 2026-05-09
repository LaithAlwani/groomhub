import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useSchedule(date) {
  const appointments = useQuery(api.appointments.getScheduleAppointments, { date });
  const approve      = useMutation(api.appointments.approveAppointment);
  const complete     = useMutation(api.appointments.completeAppointment);
  const cancel       = useMutation(api.appointments.cancelAppointment);
  const reject       = useMutation(api.appointments.rejectAppointment);
  return { appointments, approve, complete, cancel, reject };
}
