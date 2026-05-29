import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { AttachmentSection } from "./AttachmentSection";
import {
  attachmentsToForm,
  canAddPotentialContractors,
  currency,
  emptyContractorForm,
  emptyProjectForm,
  projectContractorsToForm,
  projectToForm,
  savedAttachmentsFromForm,
  type AttachmentFormState,
  type ContractorFormState,
  type Project,
  type ProjectFormState,
  type ProjectPriority,
  type ProjectStatus,
} from "../domain";

export function ProjectEditorModal({
  eyebrow,
  heading,
  initialProject,
  onClose,
  onSave,
  submitLabel,
}: {
  eyebrow: string;
  heading: string;
  initialProject?: Project;
  onClose: () => void;
  onSave: (project: Project) => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<ProjectFormState>(
    initialProject ? projectToForm(initialProject) : emptyProjectForm,
  );
  const [contractors, setContractors] = useState<ContractorFormState[]>(
    initialProject ? projectContractorsToForm(initialProject) : [],
  );
  const [attachments, setAttachments] = useState<AttachmentFormState[]>(
    initialProject ? attachmentsToForm(initialProject.attachments) : [],
  );

  function updateForm<Field extends keyof ProjectFormState>(
    field: Field,
    value: ProjectFormState[Field],
  ) {
    setForm((currentForm) => {
      const nextForm = { ...currentForm, [field]: value };

      if (field === "executionType" && value === "DIY") {
        nextForm.selectedContractorId = "";
      }

      return nextForm;
    });
  }

  function addContractor() {
    const contractor = emptyContractorForm();
    setContractors((currentContractors) => [...currentContractors, contractor]);
  }

  function saveContractor(contractorId: string) {
    setContractors((currentContractors) =>
      currentContractors.map((contractor) =>
        contractor.id === contractorId
          ? { ...contractor, isSaved: true, isExpanded: false }
          : contractor,
      ),
    );
  }

  function toggleContractor(contractorId: string) {
    setContractors((currentContractors) =>
      currentContractors.map((contractor) =>
        contractor.id === contractorId && contractor.isSaved
          ? { ...contractor, isExpanded: !contractor.isExpanded }
          : contractor,
      ),
    );
  }

  function removeContractor(contractorId: string) {
    setContractors((currentContractors) =>
      currentContractors.filter((contractor) => contractor.id !== contractorId),
    );
    if (form.selectedContractorId === contractorId) {
      updateForm("selectedContractorId", "");
    }
  }

  function updateContractor<Field extends keyof ContractorFormState>(
    contractorId: string,
    field: Field,
    value: ContractorFormState[Field],
  ) {
    setContractors((currentContractors) =>
      currentContractors.map((contractor) =>
        contractor.id === contractorId ? { ...contractor, [field]: value } : contractor,
      ),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const estimate = Number(form.estimate);
    const actual = Number(form.actual);
    const savedContractors =
      form.executionType === "Professional"
        ? contractors
            .filter((contractor) => contractor.isSaved && contractor.name.trim())
            .map((contractor) => {
              const quotedAmount = Number(contractor.quotedAmount);

              return {
                id: contractor.id,
                name: contractor.name.trim(),
                trade: contractor.trade.trim(),
                contact: contractor.contact.trim(),
                quotedAmount: Number.isFinite(quotedAmount) ? quotedAmount : undefined,
                notes: contractor.notes.trim() || undefined,
              };
            })
        : [];

    const selectedContractorStillExists = savedContractors.some(
      (contractor) => contractor.id === form.selectedContractorId,
    );

    onSave({
      id: initialProject?.id ?? crypto.randomUUID(),
      title: form.title.trim(),
      category: form.category,
      priority: form.priority,
      status: form.status,
      executionType: form.executionType,
      estimate: Number.isFinite(estimate) ? estimate : 0,
      actual: form.actual && Number.isFinite(actual) ? actual : undefined,
      timing: form.timing.trim() || "Unscheduled",
      owner:
        form.executionType === "DIY"
          ? form.owner.trim() || "DIY"
          : form.owner.trim() || "Professional",
      notes: form.notes.trim() || undefined,
      contractors: savedContractors,
      selectedContractorId: selectedContractorStillExists
        ? form.selectedContractorId
        : undefined,
      attachments: savedAttachmentsFromForm(attachments),
    });
  }

  const showDiyEstimate = form.executionType === "DIY";
  const showContractors = form.executionType === "Professional";
  const canAddContractorsForStatus = canAddPotentialContractors(form.status);
  const savedContractors = contractors.filter((contractor) => contractor.isSaved);

  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby="add-project-title"
        aria-modal="true"
        className="modal"
        role="dialog"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="add-project-title">{heading}</h2>
          </div>
          <button aria-label="Close project dialog" className="icon-button" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          <label className="field full-span">
            <span>Project title</span>
            <input
              autoFocus
              required
              placeholder="Replace porch light fixture"
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
              <option>Appliance</option>
              <option>Cosmetic</option>
              <option>Outdoor</option>
              <option>Planning</option>
            </select>
          </label>

          <label className="field">
            <span>Priority</span>
            <select
              value={form.priority}
              onChange={(event) => updateForm("priority", event.target.value as ProjectPriority)}
            >
              <option>Urgent</option>
              <option>Soon</option>
              <option>Someday</option>
            </select>
          </label>

          <label className="field">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) => updateForm("status", event.target.value as ProjectStatus)}
            >
              <option>Idea</option>
              <option>Quoted</option>
              <option>Scheduled</option>
              <option>In progress</option>
              <option>Done</option>
            </select>
          </label>

          {form.status === "Done" ? (
            <label className="field">
              <span>Actual cost</span>
              <input
                min="0"
                placeholder="840"
                type="number"
                value={form.actual}
                onChange={(event) => updateForm("actual", event.target.value)}
              />
            </label>
          ) : null}

          <fieldset className="choice-field full-span">
            <legend>Who will do the work?</legend>
            <label className={form.executionType === "DIY" ? "choice selected" : "choice"}>
              <input
                checked={form.executionType === "DIY"}
                name="executionType"
                type="radio"
                value="DIY"
                onChange={() => updateForm("executionType", "DIY")}
              />
              <span>
                <strong>DIY</strong>
                <small>Track your own time, materials, and cost.</small>
              </span>
            </label>
            <label
              className={form.executionType === "Professional" ? "choice selected" : "choice"}
            >
              <input
                checked={form.executionType === "Professional"}
                name="executionType"
                type="radio"
                value="Professional"
                onChange={() => updateForm("executionType", "Professional")}
              />
              <span>
                <strong>Professional</strong>
                <small>Compare quotes and choose a contractor.</small>
              </span>
            </label>
          </fieldset>

          {showDiyEstimate ? (
            <label className="field">
              <span>Estimated cost</span>
              <input
                min="0"
                placeholder="1200"
                type="number"
                value={form.estimate}
                onChange={(event) => updateForm("estimate", event.target.value)}
              />
            </label>
          ) : null}

          <label className="field">
            <span>Timing</span>
            <input
              placeholder="Summer 2026"
              value={form.timing}
              onChange={(event) => updateForm("timing", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Owner</span>
            <input
              placeholder="Peter + wife"
              value={form.owner}
              onChange={(event) => updateForm("owner", event.target.value)}
            />
          </label>

          {showContractors ? (
            <section className="contractor-section full-span">
              <div className="contractor-heading">
                <div>
                  <h3>Potential contractors</h3>
                  <p>
                    {canAddContractorsForStatus
                      ? "Add contractors you are researching or have received quotes from."
                      : "Keep the quote history and select who will do the work."}
                  </p>
                </div>
                <button className="secondary-button" type="button" onClick={addContractor}>
                  <Plus size={17} aria-hidden="true" />
                  Add contractor
                </button>
              </div>

              {contractors.length ? (
                <div className="contractor-list">
                  {contractors.map((contractor, index) => (
                    <article className="contractor-form-card" key={contractor.id}>
                      {contractor.isSaved ? (
                        <>
                          <button
                            aria-expanded={contractor.isExpanded}
                            className="contractor-summary-row"
                            type="button"
                            onClick={() => toggleContractor(contractor.id)}
                          >
                            <strong>{contractor.name}</strong>
                            <span>
                              {contractor.quotedAmount
                                ? currency.format(Number(contractor.quotedAmount))
                                : "No quote"}
                            </span>
                            <span>{contractor.contact || "No contact"}</span>
                          </button>

                          {contractor.isExpanded ? (
                            <div className="contractor-expanded">
                              <p>
                                <strong>Trade</strong>
                                <span>{contractor.trade || "Not specified"}</span>
                              </p>
                              <p>
                                <strong>Notes</strong>
                                <span>{contractor.notes || "No notes yet"}</span>
                              </p>
                              <button
                                className="text-button"
                                type="button"
                                onClick={() => removeContractor(contractor.id)}
                              >
                                Remove contractor
                              </button>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <div className="contractor-card-heading">
                            <strong>Contractor {index + 1}</strong>
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => removeContractor(contractor.id)}
                            >
                              Remove
                            </button>
                          </div>
                          <label className="field">
                            <span>Name</span>
                            <input
                              placeholder="Northline Plumbing"
                              value={contractor.name}
                              onChange={(event) =>
                                updateContractor(contractor.id, "name", event.target.value)
                              }
                            />
                          </label>
                          <label className="field">
                            <span>Trade</span>
                            <input
                              placeholder="Plumbing"
                              value={contractor.trade}
                              onChange={(event) =>
                                updateContractor(contractor.id, "trade", event.target.value)
                              }
                            />
                          </label>
                          <label className="field">
                            <span>Contact</span>
                            <input
                              placeholder="Phone or email"
                              value={contractor.contact}
                              onChange={(event) =>
                                updateContractor(contractor.id, "contact", event.target.value)
                              }
                            />
                          </label>
                          <label className="field">
                            <span>Quoted estimate</span>
                            <input
                              min="0"
                              placeholder="2600"
                              type="number"
                              value={contractor.quotedAmount}
                              onChange={(event) =>
                                updateContractor(contractor.id, "quotedAmount", event.target.value)
                              }
                            />
                          </label>
                          <label className="field full-span">
                            <span>Contractor notes</span>
                            <textarea
                              placeholder="Availability, quote details, concerns, or why you liked them."
                              rows={3}
                              value={contractor.notes}
                              onChange={(event) =>
                                updateContractor(contractor.id, "notes", event.target.value)
                              }
                            />
                          </label>
                          <div className="contractor-draft-actions full-span">
                            <button
                              className="secondary-button"
                              disabled={!contractor.name.trim()}
                              type="button"
                              onClick={() => saveContractor(contractor.id)}
                            >
                              Save contractor
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-contractors">
                  <p>No contractors added yet.</p>
                </div>
              )}

              {savedContractors.length ? (
                <label className="field">
                  <span>Selected contractor</span>
                  <select
                    value={form.selectedContractorId}
                    onChange={(event) =>
                      updateForm("selectedContractorId", event.target.value)
                    }
                  >
                    <option value="">Not selected yet</option>
                    {savedContractors.map((contractor, index) => (
                      <option key={contractor.id} value={contractor.id}>
                        {contractor.name.trim() || `Contractor ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </section>
          ) : null}

          <label className="field full-span">
            <span>Notes</span>
            <textarea
              placeholder="Quotes, constraints, links, measurements, or anything you want future-you to remember."
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
