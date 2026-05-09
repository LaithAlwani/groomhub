import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";

function localDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useAppointmentForm({
  appointment,
  contactId: initialContactId,
  onClose,
  prefillDate,
  prefillTime,
  prefillGroomerId,
}) {
  const { user } = useAuth();
  const isAdmin  = !!user?.isAdmin;

  const addAppointment      = useMutation(api.appointments.addAppointment);
  const updateAppointment   = useMutation(api.appointments.updateAppointment);
  const completeAppointment = useMutation(api.appointments.completeAppointment);
  const cancelAppointment   = useMutation(api.appointments.cancelAppointment);
  const users               = useQuery(api.users.listGroomers);

  const isEdit = !!appointment;
  // Lock the contact if we're editing or were handed one — only the schedule's
  // "New Appointment" path opens the modal without a contact and lets the user pick one.
  const isContactLocked = isEdit || !!initialContactId;

  const [contactId, setContactId] = useState(
    appointment?.contact_id ?? initialContactId ?? null,
  );

  const pets = useQuery(
    api.pets.getPetsByContact,
    contactId ? { contactId } : "skip",
  );
  const activePets = (pets ?? []).filter((p) => p.is_active !== false);

  // Non-admin staff can only book/edit appointments assigned to themselves, so default
  // their groomer selection to self when creating a new appointment with no prefill.
  const initialGroomerId = appointment?.groomerId
    ?? prefillGroomerId
    ?? (!isAdmin && !appointment ? user?.tokenIdentifier : null)
    ?? "";
  const initialGroomer = appointment?.groomer
    ?? (!isAdmin && !appointment ? user?.displayName : null)
    ?? "";

  const [petId,       setPetId]       = useState(appointment?.pet_id      ?? "");
  const [serviceType, setServiceType] = useState(appointment?.service_type ?? "");
  const [date,        setDate]        = useState(appointment?.date         ?? prefillDate ?? localDateString());
  const [time,        setTime]        = useState(appointment?.time         ?? prefillTime ?? "");
  const [duration,    setDuration]    = useState(appointment?.duration     != null ? String(appointment.duration) : "");
  const [groomer,     setGroomer]     = useState(initialGroomer);
  const [groomerId,   setGroomerId]   = useState(initialGroomerId);
  const [price,       setPrice]       = useState(appointment?.price        != null ? String(appointment.price) : "");
  const [noteText,    setNoteText]    = useState(appointment?.note_text    ?? "");
  const [loading,     setLoading]     = useState(false);
  const [saveError,   setSaveError]   = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [conflict,    setConflict]    = useState(null);

  // user data may arrive after first render; backfill self-assignment for staff.
  useEffect(() => {
    if (isAdmin || appointment || groomerId || !user?.tokenIdentifier) return;
    setGroomerId(user.tokenIdentifier);
    setGroomer(user.displayName ?? "");
  }, [isAdmin, appointment, groomerId, user?.tokenIdentifier, user?.displayName]);

  function clearErr(field) {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function selectClient(client) {
    if (isContactLocked) return;
    setContactId(client._id);
    setPetId("");
    clearErr("contact");
  }

  function clearClient() {
    if (isContactLocked) return;
    setContactId(null);
    setPetId("");
  }

  function selectGroomer(tokenIdentifier) {
    const sel = (users ?? []).find((u) => u.tokenIdentifier === tokenIdentifier);
    setGroomerId(tokenIdentifier);
    setGroomer(sel?.displayName ?? "");
    clearErr("groomer");
  }

  function validate() {
    const errors = {};
    if (!contactId)                       errors.contact = "Please select a client.";
    if (activePets.length > 0 && !petId)  errors.petId   = "Please select a pet.";
    if (!date.trim())                     errors.date    = "Date is required.";
    if (!groomerId)                       errors.groomer = "Please select a groomer.";
    if (price.trim() && (isNaN(parseFloat(price)) || parseFloat(price) < 0))
                                          errors.price   = "Enter a valid price.";
    return errors;
  }

  function validateComplete() {
    const errors = {};
    if (!noteText.trim()) errors.noteText = "Notes are required to complete an appointment.";
    if (!price.trim())    errors.price    = "Price is required to complete an appointment.";
    else if (isNaN(parseFloat(price)) || parseFloat(price) < 0)
                          errors.price    = "Enter a valid price.";
    return errors;
  }

  async function handleComplete() {
    setSaveError("");
    const errors = validateComplete();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);
    try {
      await completeAppointment({
        appointmentId: appointment._id,
        note_text:     noteText.trim(),
        price:         parseFloat(price),
      });
      onClose();
    } catch (err) {
      setSaveError(err.message ?? "Failed to complete appointment");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setSaveError("");
    setLoading(true);
    try {
      await cancelAppointment({ appointmentId: appointment._id });
      onClose();
    } catch (err) {
      setSaveError(err.message ?? "Failed to cancel appointment");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError("");
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    const resolvedPetId = petId || undefined;
    const resolvedNote  = noteText.trim() || undefined;
    const parsedPrice   = price.trim() ? parseFloat(price) : undefined;
    try {
      if (isEdit) {
        await updateAppointment({
          appointmentId: appointment._id,
          petId:         resolvedPetId,
          date:          date.trim(),
          time:          time.trim() || undefined,
          duration:      duration ? parseInt(duration) : undefined,
          service_type:  serviceType.trim() || undefined,
          note_text:     resolvedNote,
          groomer:       groomer.trim() || undefined,
          groomerId:     groomerId      || undefined,
          price:         parsedPrice,
        });
      } else {
        await addAppointment({
          contactId,
          petId:        resolvedPetId,
          date:         date.trim(),
          time:         time.trim() || undefined,
          duration:     duration ? parseInt(duration) : undefined,
          service_type: serviceType.trim() || undefined,
          note_text:    resolvedNote,
          groomer:      groomer.trim() || undefined,
          groomerId:    groomerId      || undefined,
          price:        parsedPrice,
        });
      }
      onClose();
    } catch (err) {
      if (err?.data?.kind === "groomer_conflict") {
        setConflict(err.data);
      } else {
        setSaveError(err.message ?? "Failed to save appointment");
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    // state
    contactId, selectClient, clearClient, isContactLocked,
    petId, setPetId,
    serviceType, setServiceType,
    date, setDate,
    time, setTime,
    duration, setDuration,
    groomer, groomerId, selectGroomer,
    price, setPrice,
    noteText, setNoteText,
    loading,
    saveError,
    fieldErrors,
    clearErr,
    conflict,
    dismissConflict: () => setConflict(null),
    // derived
    isEdit,
    isAdmin,
    users,
    activePets,
    petsLoading: contactId && pets === undefined,
    // handlers
    handleSubmit,
    handleComplete,
    handleCancel,
  };
}
