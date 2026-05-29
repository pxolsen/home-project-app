import { currency, type Project } from "../domain";

type ProjectContractorSummaryProps = {
  project: Project;
};

export function ProjectContractorSummary({ project }: ProjectContractorSummaryProps) {
  if (project.executionType === "DIY") {
    return <p className="project-subdetail">DIY estimate</p>;
  }

  const contractors = project.contractors ?? [];
  const selectedContractor = contractors.find(
    (contractor) => contractor.id === project.selectedContractorId,
  );

  if (selectedContractor) {
    return (
      <p className="project-subdetail">
        Selected: {selectedContractor.name}
        {selectedContractor.quotedAmount
          ? ` · ${currency.format(selectedContractor.quotedAmount)}`
          : ""}
      </p>
    );
  }

  if (contractors.length > 0) {
    return (
      <p className="project-subdetail">
        Professional · {contractors.length} contractor
        {contractors.length === 1 ? "" : "s"} under consideration
      </p>
    );
  }

  return <p className="project-subdetail">Professional · No contractors added yet</p>;
}
