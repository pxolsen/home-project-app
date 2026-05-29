import { FileText, Plus } from "lucide-react";
import {
  emptyAttachmentForm,
  type AttachmentFormState,
  type AttachmentType,
} from "../domain";

type AttachmentSectionProps = {
  attachments: AttachmentFormState[];
  onChange: (attachments: AttachmentFormState[]) => void;
};

export function AttachmentSection({ attachments, onChange }: AttachmentSectionProps) {
  function addAttachment() {
    onChange([...attachments, emptyAttachmentForm()]);
  }

  function saveAttachment(attachmentId: string) {
    onChange(
      attachments.map((attachment) =>
        attachment.id === attachmentId
          ? { ...attachment, isSaved: true, isExpanded: false }
          : attachment,
      ),
    );
  }

  function toggleAttachment(attachmentId: string) {
    onChange(
      attachments.map((attachment) =>
        attachment.id === attachmentId && attachment.isSaved
          ? { ...attachment, isExpanded: !attachment.isExpanded }
          : attachment,
      ),
    );
  }

  function removeAttachment(attachmentId: string) {
    onChange(attachments.filter((attachment) => attachment.id !== attachmentId));
  }

  function updateAttachment<Field extends keyof AttachmentFormState>(
    attachmentId: string,
    field: Field,
    value: AttachmentFormState[Field],
  ) {
    onChange(
      attachments.map((attachment) =>
        attachment.id === attachmentId ? { ...attachment, [field]: value } : attachment,
      ),
    );
  }

  return (
    <section className="attachment-section full-span">
      <div className="attachment-heading">
        <div>
          <h3>Documents and photos</h3>
          <p>Track receipts, warranties, permits, quotes, and photos before real uploads exist.</p>
        </div>
        <button className="secondary-button" type="button" onClick={addAttachment}>
          <Plus size={17} aria-hidden="true" />
          Add item
        </button>
      </div>

      {attachments.length ? (
        <div className="attachment-list">
          {attachments.map((attachment, index) => (
            <article className="attachment-card" key={attachment.id}>
              {attachment.isSaved ? (
                <>
                  <button
                    aria-expanded={attachment.isExpanded}
                    className="attachment-summary-row"
                    type="button"
                    onClick={() => toggleAttachment(attachment.id)}
                  >
                    <FileText size={17} aria-hidden="true" />
                    <strong>{attachment.name}</strong>
                    <span>{attachment.type}</span>
                  </button>

                  {attachment.isExpanded ? (
                    <div className="attachment-expanded">
                      <p>{attachment.notes || "No notes yet"}</p>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        Remove item
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="attachment-card-heading">
                    <strong>Item {index + 1}</strong>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <label className="field">
                    <span>Name</span>
                    <input
                      placeholder="Receipt from installer"
                      value={attachment.name}
                      onChange={(event) =>
                        updateAttachment(attachment.id, "name", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Type</span>
                    <select
                      value={attachment.type}
                      onChange={(event) =>
                        updateAttachment(
                          attachment.id,
                          "type",
                          event.target.value as AttachmentType,
                        )
                      }
                    >
                      <option>Receipt</option>
                      <option>Warranty</option>
                      <option>Permit</option>
                      <option>Quote</option>
                      <option>Photo</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label className="field full-span">
                    <span>Notes</span>
                    <textarea
                      placeholder="File location, what this proves, expiration dates, or upload notes."
                      rows={3}
                      value={attachment.notes}
                      onChange={(event) =>
                        updateAttachment(attachment.id, "notes", event.target.value)
                      }
                    />
                  </label>
                  <div className="attachment-draft-actions full-span">
                    <button
                      className="secondary-button"
                      disabled={!attachment.name.trim()}
                      type="button"
                      onClick={() => saveAttachment(attachment.id)}
                    >
                      Save item
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-attachments">
          <p>No documents or photos tracked yet.</p>
        </div>
      )}
    </section>
  );
}
