import { useState } from "react";
import { useQuery, usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useClientDetail(contactId) {

  const contact = useQuery(api.clients.getClient, { id: contactId });
  const pets = useQuery(api.pets.getPetsByContact, { contactId });
  const { results: appointments, status, loadMore } = usePaginatedQuery(
    api.appointments.getAppointmentsByContact,
    { contactId },
    { initialNumItems: 20 },
  );

  const vaccinations = useQuery(api.vaccinations.getVaccinationsByContact, { contactId });

  const deletePet             = useMutation(api.pets.deletePet);
  const deleteAppointment     = useMutation(api.appointments.deleteAppointment);
  const deleteClient          = useMutation(api.clients.deleteClient);
  const deleteVaccinationMut  = useMutation(api.vaccinations.deleteVaccination);

  const [confirmDeletePet,         setConfirmDeletePet]         = useState(null);
  const [confirmDeleteAppt,        setConfirmDeleteAppt]        = useState(null);
  const [confirmDeleteClient,      setConfirmDeleteClient]      = useState(false);
  const [confirmDeleteVaccination, setConfirmDeleteVaccination] = useState(null);
  const [apptTab,              setApptTab]             = useState("all");

  async function handleDeletePet(petId) {
    await deletePet({ petId });
    setConfirmDeletePet(null);
  }

  async function handleDeleteAppt(appointmentId) {
    await deleteAppointment({ appointmentId });
    setConfirmDeleteAppt(null);
  }

  async function handleDeleteClient(onBack) {
    await deleteClient({ clientId: contactId });
    onBack();
  }

  async function handleDeleteVaccination(vaccinationId) {
    await deleteVaccinationMut({ vaccinationId });
    setConfirmDeleteVaccination(null);
  }

  const hasLegacy = appointments?.some((a) => a.is_legacy) ?? false;
  const tabs = appointments ? [
    { id: "all", label: "All", count: appointments.length },
    ...(pets ?? [])
      .filter((p) => appointments.some((a) => a.pet_id === p._id))
      .map((p) => ({
        id: p._id,
        label: p.name || "Unnamed",
        count: appointments.filter((a) => a.pet_id === p._id).length,
      })),
    ...(hasLegacy ? [{ id: "legacy", label: "Past Notes", count: appointments.filter((a) => a.is_legacy).length }] : []),
  ] : [];

  const visible = !appointments ? [] :
    apptTab === "all"    ? appointments :
    apptTab === "legacy" ? appointments.filter((a) => a.is_legacy) :
                           appointments.filter((a) => a.pet_id === apptTab);

  return {
    contact,
    pets,
    appointments,
    vaccinations,
    status,
    loadMore,
    tabs,
    visible,
    apptTab,
    setApptTab,
    confirmDeletePet,
    setConfirmDeletePet,
    confirmDeleteAppt,
    setConfirmDeleteAppt,
    handleDeletePet,
    handleDeleteAppt,
    confirmDeleteClient,
    setConfirmDeleteClient,
    handleDeleteClient,
    confirmDeleteVaccination,
    setConfirmDeleteVaccination,
    handleDeleteVaccination,
  };
}
