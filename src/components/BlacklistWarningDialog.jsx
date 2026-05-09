import Icon from "../assets/Icon";

export default function BlacklistWarningDialog({ pet, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div className="bg-background-card rounded-2xl shadow-soft w-full max-w-sm p-6 mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-tag-red flex items-center justify-center shrink-0">
            <Icon name="alert" className="w-5 h-5 text-danger" />
          </div>
          <h3 className="font-semibold text-text-primary">Blacklisted Pet</h3>
        </div>
        <p className="text-sm text-text-secondary mb-5">
          <span className="font-semibold text-text-primary">{pet.name}</span> is blacklisted. Are you sure you want to book an appointment for this pet?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-border text-text-secondary rounded-xl py-2 text-sm font-medium hover:bg-ui-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-danger hover:bg-danger/90 text-white rounded-xl py-2 text-sm font-medium transition-colors"
          >
            Book Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
