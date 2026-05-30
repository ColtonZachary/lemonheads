"use client";

import { useActionState } from "react";

import {
  saveDetailerPayRates,
  type HubPayRatesActionState,
} from "@/app/actions/hub-pay-rates";
import { HubActionAlert, HubStatCard } from "@/components/hub/hub-page";
import { HubFormSection, HubInput } from "@/components/hub/hub-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatPayDollarsInput,
  type AddonPayRateEditorRow,
  type PackagePayRateEditorRow,
} from "@/lib/hub/detailer-pay-rates";

const EMPTY: HubPayRatesActionState = { ok: false, message: "" };

const payInputClass = "w-full text-right font-mono text-xs";

export function DetailerPayRatesPanel({
  packages,
  addons,
}: {
  packages: PackagePayRateEditorRow[];
  addons: AddonPayRateEditorRow[];
}) {
  const [state, action, pending] = useActionState(saveDetailerPayRates, EMPTY);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <HubStatCard label="Packages" value={packages.length} />
        <HubStatCard label="Add-ons" value={addons.length} />
      </div>

      <form action={action} className="space-y-6">
        <HubActionAlert state={state} />

        <HubFormSection
          title="Package pay"
          description="Flat per job · Senior usually +$5"
        >
          <Card className="overflow-hidden border-border/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-3 font-mono text-[9px] uppercase text-muted-foreground">
                      Package
                    </TableHead>
                    <TableHead className="px-3 text-right font-mono text-[9px] uppercase text-muted-foreground">
                      Regular ($)
                    </TableHead>
                    <TableHead className="px-3 text-right font-mono text-[9px] uppercase text-muted-foreground">
                      Senior ($)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.packageKey} className="font-mono text-xs">
                      <TableCell className="px-3 py-2">{pkg.packageName}</TableCell>
                      <TableCell className="px-3 py-2">
                        <label className="sr-only">Regular pay for {pkg.packageName}</label>
                        <HubInput
                          name={`pkg_regular_${pkg.packageKey}`}
                          inputMode="decimal"
                          required
                          defaultValue={formatPayDollarsInput(pkg.regularCents)}
                          className={payInputClass}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <label className="sr-only">Senior pay for {pkg.packageName}</label>
                        <HubInput
                          name={`pkg_senior_${pkg.packageKey}`}
                          inputMode="decimal"
                          required
                          defaultValue={formatPayDollarsInput(pkg.seniorCents)}
                          className={payInputClass}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </HubFormSection>

        <HubFormSection title="Add-on pay" description="Per add-on on a booking">
          <Card className="overflow-hidden border-border/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-3 font-mono text-[9px] uppercase text-muted-foreground">
                      Add-on
                    </TableHead>
                    <TableHead className="px-3 text-right font-mono text-[9px] uppercase text-muted-foreground">
                      Regular ($)
                    </TableHead>
                    <TableHead className="px-3 text-right font-mono text-[9px] uppercase text-muted-foreground">
                      Senior ($)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addons.map((addon) => (
                    <TableRow key={addon.addonKey} className="font-mono text-xs">
                      <TableCell className="px-3 py-2">{addon.displayLabel}</TableCell>
                      <TableCell className="px-3 py-2">
                        <HubInput
                          name={`addon_regular_${addon.fieldId}`}
                          inputMode="decimal"
                          required
                          defaultValue={formatPayDollarsInput(addon.regularCents)}
                          className={payInputClass}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <HubInput
                          name={`addon_senior_${addon.fieldId}`}
                          inputMode="decimal"
                          required
                          defaultValue={formatPayDollarsInput(addon.seniorCents)}
                          className={payInputClass}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </HubFormSection>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save pay rates"}
        </Button>
      </form>
    </div>
  );
}
