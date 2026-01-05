"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const industries = [
  { value: "general", label: "General / Other" },
  { value: "restaurant", label: "Restaurant / Food Service" },
  { value: "contractor", label: "Contractor / Construction" },
  { value: "professional-services", label: "Professional Services" },
  { value: "retail", label: "Retail" },
  { value: "ecommerce", label: "E-commerce" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    businessType: "",
    industry: "general",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.businessName.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create project");
      }

      const project = await response.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Client Onboarding</CardTitle>
          <CardDescription>
            Create a new project to start organizing documents for a client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Input
              label="Project Name"
              placeholder="e.g., Q1 2024 Onboarding"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <Input
              label="Business Name"
              placeholder="e.g., Acme Corporation"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              required
            />

            <Input
              label="Business Type (Optional)"
              placeholder="e.g., LLC, Corporation, Sole Proprietor"
              value={formData.businessType}
              onChange={(e) =>
                setFormData({ ...formData, businessType: e.target.value })
              }
            />

            <Select
              label="Industry"
              options={industries}
              value={formData.industry}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" isLoading={isLoading}>
                Create Project
              </Button>
              <Link href="/projects">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
