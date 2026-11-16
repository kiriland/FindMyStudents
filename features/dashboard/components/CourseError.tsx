"use client";

import ActionGroup from "@/components/ui/ActionGroup";
import Button, { ButtonLink } from "@/components/Button";
import EmptyState from "@/components/ui/EmptyState";

export default function CourseError({ retry }: { retry: () => void }) {
  return (
    <EmptyState
      role="alert"
      heading="h1"
      title="Could not load this course"
      description="Please try again in a moment."
    >
      <ActionGroup>
        <Button type="button" onClick={retry}>
          Try again
        </Button>
        <ButtonLink href="/dashboard">Browse courses</ButtonLink>
      </ActionGroup>
    </EmptyState>
  );
}
