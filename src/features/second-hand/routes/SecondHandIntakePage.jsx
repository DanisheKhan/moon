import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Button,
  Input,
  Select,
  Card,
  Badge,
  Modal,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@/shared/ui';
import { useBuybackIntakes, useCreateBuybackIntake } from '../hooks/useSecondHand';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { getErrorMessage } from '@/shared/lib/errors';
import { Plus, ShieldAlert, FileText, Printer } from 'lucide-react';

export function SecondHandIntakePage() {
  const { store } = useOutletContext();
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [formError, setFormError] = useState('');

  // Form State
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerIdType, setSellerIdType] = useState('aadhaar');
  const [sellerIdNumber, setSellerIdNumber] = useState('');
  const [brandName, setBrandName] = useState('Apple');
  const [modelName, setModelName] = useState('');
  const [imei, setImei] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');

  // Diagnostic Checklist
  const [screenOk, setScreenOk] = useState(true);
  const [touchOk, setTouchOk] = useState(true);
  const [cameraOk, setCameraOk] = useState(true);
  const [batteryHealth, setBatteryHealth] = useState(88);
  const [bodyCondition, setBodyCondition] = useState('minor_scratches');

  const { data: intakes = [], isLoading } = useBuybackIntakes(store?.id);
  const createIntakeMutation = useCreateBuybackIntake();

  // Dynamic Grade Calculation
  function calculateGrade() {
    if (!screenOk || !touchOk) return 'C';
    if (!cameraOk) return 'C';
    if (bodyCondition === 'dents') return 'B';
    if (batteryHealth < 80) return 'B';
    if (bodyCondition === 'minor_scratches') return 'A';
    return 'A+';
  }

  const computedGrade = calculateGrade();

  async function handleSubmitIntake(e) {
    e.preventDefault();
    if (!sellerName || !sellerPhone || !sellerIdNumber || !imei || !agreedPrice) {
      setFormError('Please fill in all mandatory seller KYC and device fields.');
      return;
    }
    setFormError('');

    try {
      const result = await createIntakeMutation.mutateAsync({
        store_id: store.id,
        seller_name: sellerName.trim(),
        seller_phone: sellerPhone.trim(),
        seller_id_type: sellerIdType,
        seller_id_number: sellerIdNumber.trim(),
        brand_name: brandName,
        model_name: modelName.trim(),
        imei: imei.trim(),
        condition_checklist: {
          screen_ok: screenOk,
          touch_ok: touchOk,
          camera_ok: cameraOk,
          battery_health: parseInt(batteryHealth, 10),
          body_condition: bodyCondition,
        },
        calculated_grade: computedGrade,
        agreed_price: parseFloat(agreedPrice) || 0,
        status: 'intake_completed',
      });

      setSelectedIntake(result);
      setIsIntakeModalOpen(false);
      // Reset form
      setSellerName('');
      setSellerPhone('');
      setSellerIdNumber('');
      setModelName('');
      setImei('');
      setAgreedPrice('');
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-text">
            Second-Hand Mobile Buyback & Intake
          </h1>
          <p className="text-sm text-muted">
            Strict seller KYC, automated IMEI uniqueness checks, condition checklist grading.
          </p>
        </div>
        <Button variant="solid" onClick={() => setIsIntakeModalOpen(true)}>
          <Plus size={16} /> New Device Intake
        </Button>
      </div>

      {/* Intakes History Table */}
      {isLoading ? (
        <div className="py-12 text-center text-muted">Loading buyback records...</div>
      ) : intakes.length === 0 ? (
        <Card className="p-8 text-center text-muted border-dashed">
          No second-hand intake records yet. Click "New Device Intake" to start a buyback.
        </Card>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Seller & Contact</TableHeaderCell>
              <TableHeaderCell>Device & Model</TableHeaderCell>
              <TableHeaderCell>IMEI Number</TableHeaderCell>
              <TableHeaderCell>Grade</TableHeaderCell>
              <TableHeaderCell>Buyback Price</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {intakes.map((intake) => (
              <TableRow key={intake.id}>
                <TableCell>
                  <div className="font-medium text-text">{intake.seller_name}</div>
                  <div className="text-xs text-muted">
                    {intake.seller_phone} ({intake.seller_id_type.toUpperCase()})
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {intake.brand_name} {intake.model_name}
                  </div>
                  <div className="text-xs text-muted">{formatDate(intake.created_at)}</div>
                </TableCell>
                <TableCell className="font-mono text-xs font-medium">
                  {intake.imei}
                </TableCell>
                <TableCell>
                  <Badge variant={intake.calculated_grade === 'A+' ? 'success' : 'default'}>
                    Grade {intake.calculated_grade}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(intake.agreed_price)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      intake.status === 'added_to_stock'
                        ? 'success'
                        : intake.status === 'rejected'
                        ? 'danger'
                        : 'accent'
                    }
                  >
                    {intake.status === 'intake_completed'
                      ? 'Intake Completed'
                      : intake.status === 'added_to_stock'
                      ? 'In Stock'
                      : intake.status === 'rejected'
                      ? 'Rejected'
                      : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedIntake(intake)}
                  >
                    <FileText size={14} /> Receipt
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* New Device Intake Modal */}
      <Modal
        isOpen={isIntakeModalOpen}
        onClose={() => {
          setIsIntakeModalOpen(false);
          setFormError('');
        }}
        title="Second-Hand Mobile Intake Form"
        size="lg"
      >
        <form onSubmit={handleSubmitIntake} className="space-y-5">
          {formError && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Seller KYC */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text uppercase tracking-wider pb-1 border-b border-border">
              1. Seller Verification (Mandatory KYC)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="seller-name"
                label="Seller Full Name"
                placeholder="As per Government ID"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                required
              />
              <Input
                id="seller-phone"
                label="Contact Phone"
                placeholder="10-digit mobile"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                id="seller-id-type"
                label="Government ID Proof"
                options={[
                  { value: 'aadhaar', label: 'Aadhaar Card' },
                  { value: 'pan', label: 'PAN Card' },
                  { value: 'driving_license', label: 'Driving License' },
                  { value: 'voter_id', label: 'Voter ID' },
                ]}
                value={sellerIdType}
                onChange={(e) => setSellerIdType(e.target.value)}
              />
              <Input
                id="seller-id-number"
                label="ID Document Number"
                placeholder="e.g. 1234 5678 9012"
                value={sellerIdNumber}
                onChange={(e) => setSellerIdNumber(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section 2: Device & IMEI */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text uppercase tracking-wider pb-1 border-b border-border">
              2. Device & IMEI Uniqueness Verification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                id="intake-brand"
                label="Brand"
                options={[
                  { value: 'Apple', label: 'Apple' },
                  { value: 'Samsung', label: 'Samsung' },
                  { value: 'OnePlus', label: 'OnePlus' },
                  { value: 'Xiaomi', label: 'Xiaomi' },
                  { value: 'Vivo', label: 'Vivo' },
                ]}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
              <Input
                id="intake-model"
                label="Model & Storage"
                placeholder="e.g. iPhone 13 128GB"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                required
              />
            </div>
            <Input
              id="intake-imei"
              label="IMEI Number (15 Digits - Dial *#06#)"
              placeholder="e.g. 358941091234567"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              required
            />
          </div>

          {/* Section 3: Diagnostic Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <h4 className="text-sm font-medium text-text uppercase tracking-wider">
                3. Condition Checklist
              </h4>
              <Badge variant="accent">Computed Grade: {computedGrade}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 border border-border p-3.5 rounded-xl cursor-pointer hover:bg-bg/60 transition-colors">
                <input
                  type="checkbox"
                  checked={screenOk}
                  onChange={(e) => setScreenOk(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Original Screen</span>
              </label>

              <label className="flex items-center gap-2.5 border border-border p-3.5 rounded-xl cursor-pointer hover:bg-bg/60 transition-colors">
                <input
                  type="checkbox"
                  checked={touchOk}
                  onChange={(e) => setTouchOk(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Touch & FaceID OK</span>
              </label>

              <label className="flex items-center gap-2.5 border border-border p-3.5 rounded-xl cursor-pointer hover:bg-bg/60 transition-colors">
                <input
                  type="checkbox"
                  checked={cameraOk}
                  onChange={(e) => setCameraOk(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Cameras Working</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                id="body-condition"
                label="Body Physical Condition"
                options={[
                  { value: 'clean', label: 'Clean / Like New' },
                  { value: 'minor_scratches', label: 'Minor Scratches (Normal)' },
                  { value: 'dents', label: 'Visible Dents / Blemishes' },
                ]}
                value={bodyCondition}
                onChange={(e) => setBodyCondition(e.target.value)}
              />
              <Input
                id="battery-pct"
                label="Battery Health %"
                type="number"
                min="50"
                max="100"
                value={batteryHealth}
                onChange={(e) => setBatteryHealth(e.target.value)}
              />
            </div>
          </div>

          {/* Section 4: Valuation */}
          <div className="pt-2 border-t border-border">
            <Input
              id="agreed-price"
              label="Agreed Buyback Price (₹)"
              type="number"
              placeholder="e.g. 28000"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsIntakeModalOpen(false);
                setFormError('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="solid" pending={createIntakeMutation.isPending}>
              Complete Intake & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Buyback Receipt Modal */}
      {selectedIntake && (
        <Modal
          isOpen={Boolean(selectedIntake)}
          onClose={() => setSelectedIntake(null)}
          title="Buyback Purchase Certificate"
          size="lg"
        >
          <div className="space-y-4">
            <div className="border border-border p-5 rounded-xl bg-surface font-mono text-xs space-y-3">
              <div className="text-center space-y-1">
                <div className="font-medium text-sm">{store?.name}</div>
                <div>Second-Hand Mobile Purchase Voucher</div>
                <div>GSTIN: {store?.gstin}</div>
              </div>

              <div className="border-t border-b border-dashed border-border py-2 space-y-1">
                <div>Date: {formatDate(selectedIntake.created_at)}</div>
                <div>Seller: {selectedIntake.seller_name}</div>
                <div>Phone: {selectedIntake.seller_phone}</div>
                <div>
                  ID: {selectedIntake.seller_id_type.toUpperCase()} - {selectedIntake.seller_id_number}
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-medium">
                  Device: {selectedIntake.brand_name} {selectedIntake.model_name}
                </div>
                <div>IMEI: {selectedIntake.imei}</div>
                <div>Assessed Grade: Grade {selectedIntake.calculated_grade}</div>
                <div className="font-medium text-sm pt-2">
                  Agreed Payout: {formatCurrency(selectedIntake.agreed_price)}
                </div>
              </div>

              <div className="border-t border-dashed border-border pt-4 mt-4 space-y-4 text-[10px]">
                <div className="flex justify-between">
                  <span>Seller Signature: ____________</span>
                  <span>Store Executive: ____________</span>
                </div>
                <p className="text-muted text-center">
                  Seller declares that the device is legally owned and free of all encumbrances.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedIntake(null)}>
                Close
              </Button>
              <Button variant="solid" onClick={() => window.print()}>
                <Printer size={16} /> Print Voucher
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
