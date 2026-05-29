import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { AttachmentSection } from "./AttachmentSection";
import {
  attachmentsToForm,
  emptyHistoryRecordForm,
  historyRecordToForm,
  savedAttachmentsFromForm,
  type AttachmentFormState,
  type HistoryRecord,
  type HistoryRecordFormState,
} from "../domain";

export function HistoryRecordModal({
  eyebrow,
  heading,
  initialRecord,
  onClose,
  onDelete,
  onSave,
  submitLabel,
}: {
  eyebrow: string;
  heading: string;
  initialRecord?: HistoryRecord;
  onClose: () => void;
  onDelete?: () => void;
  onSave: (record: HistoryRecord) => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<HistoryRecordFormState>(
    initialRecord ? historyRecordToForm(initialRecord) : emptyHistoryRecordForm,
  );
  const [attachments, setAttachments] = useState<AttachmentFormState[]>(
    initialRecord ? attachmentsToForm(initialRecord.attachments) : [],
  );

  function updateForm<Field extends keyof HistoryRecordFormState>(
    field: Field,
    value: HistoryRecordFormState[Field],
  ) {
    setForm((currentForm) => {
      const nextForm = { ...currentForm, [field]: value };

      if (field === "executionType" && value === "DIY") {
        nextForm.contractor = "";
      }

      return nextForm;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(form.amount);
    onSave({
      id: initialRecord?.id ?? crypto.randomUUID(),
      title: form.title.trim(),
      category: form.category,
      completedDate: form.completedDate.trim() || "Date unknown",
      amount: Number.isFinite(amount) ? amount : 0,
      executionType: form.executionType,
      contractor:
        form.executionType === "Professional" ? form.contractor.trim() : "",
      notes: form.notes.trim() || undefined,
      attachments: savedAttachmentsFromForm(attachments),
    });
  }

  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby="history-record-title"
        aria-modal="true"
        className="modal"
        role="dialog"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="history-record-title">{heading}</h2>
          </div>
          <button aria-label="Close history dialog" className="icon-button" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          <label className="field full-span">
            <span>Work completed</span>
            <input
              autoFocus
              required
              placeholder="Roof replaced"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Category</span>
            <select
              value={form.category}
              onChange={(event) => updateForm("category", event.target.value)}
            >
              <option>Maintenance</option>
              <option>Repair</option>
              <option>Renovation</option>
              <option>Inspection</option>
              <option>Appliance</option>
              <option>Electrical</option>
              <option>Plumbing</option>
              <option>Outdoor</option>
            </select>
          </label>

          <label className="field">
            <span>Completed date</span>
            <input
              placeholder="April 2024"
              value={form.completedDate}
              onChange={(event) => updateForm("completedDate", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Cost</span>
            <input
              min="0"
              placeholder="2500"
              type="number"
              value={form.amount}
              onChange={(event) => updateForm("amount", event.target.value)}
            />
          </label>

          <fieldset className="choice-field full-span">
            <legend>Who did the work?</legend>
            <label className={form.executionType === "DIY" ? "choice selected" : "choice"}>
              <input
                checked={form.executionType === "DIY"}
                name="historyExecutionType"
                type="radio"
                value="DIY"
                onChange={() => updateForm("executionType", "DIY")}
              />
              <span>
                <strong>DIY</strong>
                <small>Work done by you or household members.</small>
              </span>
            </label>
            <label
              className={form.executionType === "Professional" ? "choice selected" : "choice"}
            >
              <input
                checked={form.executionType === "Professional"}
                name="historyExecutionType"
                type="radio"
                value="Professional"
                onChange={() => updateForm("executionType", "Professional")}
              />
              <span>
                <strong>Professional</strong>
                <small>Work done by a contractor, vendor, or service provider.</small>
              </span>
            </label>
          </fieldset>

          {form.executionType === "Professional" ? (
            <label className="field full-span">
              <span>Contractor or vendor</span>
              <input
                placeholder="Northline Plumbing"
                value={form.contractor}
                onChange={(event) => updateForm("contractor", event.target.value)}
              />
            </label>
          ) : null}

          <label className="field full-span">
            <span>Notes</span>
            <textarea
              placeholder="Warranty details, model numbers, what changed, or anything useful for future owners."
              rows={4}
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
            />
          </label>

          <AttachmentSection
            attachments={attachments}
            onChange={setAttachments}
          />

          <div className="modal-actions full-span">
            {onDelete ? (
              <button className="danger-button" type="button" onClick={onDelete}>
                Delete record
              </button>
            ) : null}
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              <Plus size={18} aria-hidden="true" />
              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
