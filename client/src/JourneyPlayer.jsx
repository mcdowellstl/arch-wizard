import { useState, useEffect, useCallback } from 'react'

// ─── Node Renderers ──────────────────────────────────────────────────────────

function MultipleChoiceNode({ node, onAnswer }) {
  return (
    <div className="animate-slide-up flex flex-col gap-3">
      {node.options.map((opt, i) => (
        <button
          key={opt.value}
          className="choice-btn"
          style={{ animationDelay: `${i * 40}ms` }}
          onClick={() => onAnswer(opt.label, opt.next)}
          id={`choice-${opt.value}`}
        >
          <span
            className="text-lg"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--color-surface-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--color-accent)',
            }}
          >
            {String.fromCharCode(65 + i)}
          </span>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function YesNoNode({ node, onAnswer }) {
  return (
    <div className="animate-slide-up flex gap-4">
      <button className="no-btn" id="btn-no" onClick={() => onAnswer('No', node.no)}>
        ✕ No
      </button>
      <button className="yes-btn" id="btn-yes" onClick={() => onAnswer('Yes', node.yes)}>
        ✓ Yes
      </button>
    </div>
  )
}

function QuickFixNode({ node, onAnswer }) {
  const [resolved, setResolved] = useState(null)
  return (
    <div className="animate-slide-up flex flex-col gap-5">
      <div className="card p-5">
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            marginBottom: 14,
          }}
        >
          ⚡ Quick Fix Steps
        </p>
        <ol className="flex flex-col gap-3">
          {node.instructions.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="step-badge">{i + 1}</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.55, paddingTop: 3 }}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {resolved === null && (
        <div className="animate-fade-in">
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            {node.resolvedPrompt}
          </p>
          <div className="flex gap-4">
            <button className="no-btn" id="fix-no" onClick={() => { setResolved(false); onAnswer('No — not resolved', node.resolvedNo) }}>
              ✕ No
            </button>
            <button className="yes-btn" id="fix-yes" onClick={() => { setResolved(true); onAnswer('Yes — resolved', node.resolvedYes) }}>
              ✓ Yes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PhotoUploadNode({ node, onPhotoCapture, onNext }) {
  const [photoData, setPhotoData] = useState(null)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoData({ name: file.name, dataUrl: ev.target.result })
      onPhotoCapture(node.fieldKey, { name: file.name, captured: true })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="animate-slide-up flex flex-col gap-5">
      <label htmlFor="photo-input" className="photo-drop">
        {photoData ? (
          <>
            <img
              src={photoData.dataUrl}
              alt="Captured error"
              style={{ maxHeight: 180, borderRadius: 10, objectFit: 'cover' }}
            />
            <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: 14 }}>
              ✓ {photoData.name}
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 48 }}>📸</span>
            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 15 }}>
              Tap to take a photo
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{node.prompt}</span>
          </>
        )}
      </label>
      <input
        id="photo-input"
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        className="btn-primary"
        id="photo-next"
        disabled={!photoData}
        style={{ opacity: photoData ? 1 : 0.4 }}
        onClick={() => onNext('Photo captured', node.next)}
      >
        Continue →
      </button>
      <button
        className="btn-secondary"
        id="photo-skip"
        onClick={() => onNext('Photo skipped', node.next)}
      >
        Skip — no photo available
      </button>
    </div>
  )
}

function TextInputNode({ node, onNext }) {
  const [value, setValue] = useState('')
  const valid =
    value.trim().length >= (node.validation?.minLength ?? 1) &&
    value.trim().length <= (node.validation?.maxLength ?? 100)

  return (
    <div className="animate-slide-up flex flex-col gap-5">
      <div className="card p-4">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 12 }}>
          {node.prompt}
        </p>
        <input
          className="text-input"
          id={`input-${node.fieldKey}`}
          type="text"
          placeholder={node.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          maxLength={node.validation?.maxLength ?? 30}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <button
        className="btn-primary"
        id="text-next"
        disabled={!valid}
        style={{ opacity: valid ? 1 : 0.4 }}
        onClick={() => onNext(value.trim(), node.next, { [node.fieldKey]: value.trim() })}
      >
        Continue →
      </button>
    </div>
  )
}

function MultiFieldOptionalNode({ node, onNext }) {
  // keyed state for every field: { fieldKey: value }
  const [textValues, setTextValues] = useState(() =>
    Object.fromEntries(node.fields.filter((f) => f.type === 'text').map((f) => [f.fieldKey, '']))
  )
  const [photos, setPhotos] = useState(() =>
    Object.fromEntries(node.fields.filter((f) => f.type === 'photo').map((f) => [f.fieldKey, null]))
  )

  function handleTextChange(fieldKey, raw) {
    setTextValues((prev) => ({ ...prev, [fieldKey]: raw.toUpperCase() }))
  }

  function handlePhotoChange(fieldKey, file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) =>
      setPhotos((prev) => ({ ...prev, [fieldKey]: { name: file.name, dataUrl: ev.target.result, captured: true } }))
    reader.readAsDataURL(file)
  }

  function handleContinue() {
    const extraData = { ...textValues }
    Object.entries(photos).forEach(([k, v]) => { if (v) extraData[k] = v })
    const filled = [
      ...Object.values(textValues).filter(Boolean),
      ...Object.values(photos).filter(Boolean),
    ].length
    const label = filled === 0 ? 'Skipped device info' : `${filled} field${filled > 1 ? 's' : ''} provided`
    onNext(label, node.next, extraData)
  }

  return (
    <div className="animate-slide-up flex flex-col gap-4">
      {/* Incentive hint banner */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: 12,
          padding: '12px 14px',
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.55, margin: 0 }}>
          {node.hint}
        </p>
      </div>

      {/* Render each field */}
      {node.fields.map((field, i) => {
        if (field.type === 'text') {
          return (
            <div key={field.fieldKey} className="card p-4">
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  marginBottom: 10,
                }}
              >
                {i + 1}. {field.label}
                <span style={{ marginLeft: 6, color: 'var(--color-surface-3)', fontWeight: 500, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
                  optional
                </span>
              </p>
              <input
                className="text-input"
                id={`mf-${field.fieldKey}`}
                type="text"
                placeholder={field.placeholder}
                value={textValues[field.fieldKey]}
                onChange={(e) => handleTextChange(field.fieldKey, e.target.value)}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          )
        }

        if (field.type === 'photo') {
          const photo = photos[field.fieldKey]
          return (
            <div key={field.fieldKey} className="card p-4">
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  marginBottom: 10,
                }}
              >
                {i + 1}. {field.label}
                <span style={{ marginLeft: 6, color: 'var(--color-surface-3)', fontWeight: 500, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
                  optional
                </span>
              </p>
              <label
                htmlFor={`mf-photo-${field.fieldKey}`}
                className="photo-drop"
                style={{ padding: '20px 16px' }}
              >
                {photo ? (
                  <>
                    <img
                      src={photo.dataUrl}
                      alt="Printer"
                      style={{ maxHeight: 130, borderRadius: 8, objectFit: 'cover' }}
                    />
                    <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: 13 }}>
                      ✓ {photo.name}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 34 }}>📸</span>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 600 }}>
                      {field.prompt}
                    </span>
                  </>
                )}
              </label>
              <input
                id={`mf-photo-${field.fieldKey}`}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => handlePhotoChange(field.fieldKey, e.target.files[0])}
              />
            </div>
          )
        }

        return null
      })}

      <button className="btn-primary" id="mf-continue" onClick={handleContinue} style={{ marginTop: 4 }}>
        Continue →
      </button>
    </div>
  )
}

function TerminalResolvedNode() {
  return (
    <div className="animate-slide-up flex flex-col items-center gap-6 py-8">
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)',
          border: '2px solid rgba(34,197,94,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 44,
        }}
      >
        ✅
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-success)', marginBottom: 8 }}>
          Issue Resolved
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
          No ticket needed. You're back in business.
        </p>
      </div>
    </div>
  )
}

// ─── Ticket builder ─────────────────────────────────────────────────────────
function buildTicketDetails(session, contact) {
  const cat    = session.category ?? 'other'
  const crumbs = session.breadcrumbs ?? []

  const DEVICE_LABEL = {
    printer: 'Printer',
    pos:     'Point of Sale',
    kds:     'Kitchen Display System',
    kiosk:   'Kiosk',
    other:   'Other Equipment',
  }
  // Short service codes used for Service / Service Offering fields
  const SERVICE_CODE = {
    printer: 'Printer',
    pos:     'POS',
    kds:     'KDS',
    kiosk:   'Kiosk',
    other:   'Other',
  }
  const deviceLabel   = DEVICE_LABEL[cat]  ?? 'Unknown Device'
  const serviceCode   = SERVICE_CODE[cat]  ?? 'Other'

  // Pull key answers from breadcrumbs by nodeId
  const get = (id) => crumbs.find((c) => c.nodeId === id)?.answer ?? ''
  const locationAnswer = get('printer_location')
  const stationAnswer  = crumbs.find((c) =>
    ['printer_device_pos','printer_device_kvs','printer_device_kiosk'].includes(c.nodeId)
  )?.answer ?? ''
  const triageNodes = ['printer_triage','pos_triage','kds_triage','kiosk_triage','other_triage']
  const issueAnswer   = crumbs.find((c) => triageNodes.includes(c.nodeId))?.answer ?? ''
  const otpAnswer     = get('otp_certification_check')
  const hwReplAnswer  = get('hardware_replacement_check')

  // Assignment Group: OTP certified AND hardware replacement → OTP Pros, else L1
  const isOtp   = otpAnswer.toLowerCase().startsWith('yes')
  const isHwRepl = hwReplAnswer.toLowerCase().startsWith('yes')
  const assignmentGroup = (isOtp && isHwRepl)
    ? 'OTP Pros - Rest - US'
    : 'Unisys RTS L1 - SD - US'

  // Category: Hardware vs Software
  const softKeys = ['garbled','software','crash','slow','driver','lagging','update']
  const issueLC  = issueAnswer.toLowerCase()
  const isHardware = !softKeys.some((k) => issueLC.includes(k))

  // Priority 1-4
  let priority = 3
  if (['not printing at all','screen is black','screen frozen','payment terminal'].some((k) => issueLC.includes(k))) priority = 2
  if (['paper jam','paper out','error light'].some((k) => issueLC.includes(k))) priority = 3
  if (['garbled','slow','lagging'].some((k) => issueLC.includes(k))) priority = 4
  if (cat === 'pos' && priority === 3) priority = 2  // POS outages are high-impact

  const locationParts = [locationAnswer, stationAnswer].filter(Boolean).join(' → ')
  const shortDesc = [
    deviceLabel,
    locationParts ? `at ${locationParts}` : null,
    issueAnswer   ? `— ${issueAnswer}` : null,
  ].filter(Boolean).join(' ')

  const lines = [
    '=== ARCH WIZARD DIAGNOSTIC REPORT ===',
    `Submitted        : ${new Date().toLocaleString()}`,
    `Device Category  : ${deviceLabel}`,
    locationAnswer ? `Location         : ${locationAnswer}` : null,
    stationAnswer  ? `Station          : ${stationAnswer}`  : null,
    `Issue Reported   : ${issueAnswer || 'N/A'}`,
    '',
    '--- Diagnostic Steps ---',
    ...crumbs.map((c, i) => `${String(i + 1).padStart(2, '0')}. [${c.nodeTitle.padEnd(22)}] ${c.answer}`),
    '',
    '--- Device Info ---',
    session.printer_model ? `Model  : ${session.printer_model}` : null,
    session.serial_number ? `Serial : ${session.serial_number}` : null,
    '',
    '--- Contact ---',
    `Name         : ${contact.name}`,
    `Store #      : ${contact.store}`,
    `Address      : ${contact.address}`,
    `Phone        : ${contact.phone}`,
    contact.backupName  ? `Backup Name  : ${contact.backupName}`  : null,
    contact.backupPhone ? `Backup Phone : ${contact.backupPhone}` : null,
    '',
    '--- Technician ---',
    `OTP Certified      : ${otpAnswer  || 'No'}`,
    `HW Replacement Req : ${hwReplAnswer || 'N/A'}`,
    `Assignment Group   : ${assignmentGroup}`,
  ].filter((l) => l !== null).join('\n')

  return {
    ticketNum:       'RC' + String(Math.floor(Math.random() * 9000000) + 1000000),
    contactType:     'Mobile',
    shortDesc:       shortDesc.slice(0, 160),
    longDesc:        lines,
    service:         serviceCode,
    serviceOffering: `${serviceCode} [US] [NCR]`,
    category:        isHardware ? 'Hardware' : 'Software',
    subcategory:     deviceLabel,
    assignmentGroup,
    priority,
  }
}

function TerminalSubmitTicketNode({ session, currentUser, onReset }) {
  // Locked fields come from the auth session and cannot be edited on-device
  const lockedInfo = {
    name:    currentUser?.name    ?? '',
    store:   currentUser?.store   ?? '',
    address: currentUser?.address ?? '',
  }
  // Editable contact fields
  const [phone,         setPhone]         = useState(currentUser?.phone ?? '')
  const [backupName,    setBackupName]    = useState('')
  const [backupPhone,   setBackupPhone]   = useState('')
  const [submitted,  setSubmitted]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [ticket,     setTicket]     = useState(null)

  async function handleSubmit() {
    setLoading(true)
    const contact = { ...lockedInfo, phone, backupName, backupPhone }
    const td = buildTicketDetails(session, contact)
    setTicket(td)
    try {
      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...session, contact, ticket: td }),
      })
    } catch (_) {
      // offline-tolerant
    }
    setLoading(false)
    setSubmitted(true)
  }

  // ─── Confirmed screen ────────────────────────────────────────────────────
  if (submitted && ticket) {
    const PRIORITY_LABEL = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' }
    const PRIORITY_COLOR = { 1: '#ef4444', 2: '#f97316', 3: '#facc15', 4: '#4ade80' }
    const rows = [
      { label: 'Ticket #',          value: ticket.ticketNum,        accent: true },
      { label: 'Contact Type',      value: ticket.contactType },
      { label: 'Service',           value: ticket.service },
      { label: 'Service Offering',  value: ticket.serviceOffering },
      { label: 'Category',          value: ticket.category },
      { label: 'Subcategory',       value: ticket.subcategory },
      { label: 'Assignment Group',  value: ticket.assignmentGroup },
      {
        label: 'Priority',
        value: `${ticket.priority} — ${PRIORITY_LABEL[ticket.priority]}`,
        color: PRIORITY_COLOR[ticket.priority],
      },
    ]
    return (
      <div className="animate-slide-up flex flex-col gap-4">
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 8 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(249,115,22,0.15)',
            border: '2px solid rgba(249,115,22,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
          }}>
            🎫
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 4 }}>
              Ticket Created
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
              Support team notified · Response &lt;4 hrs
            </p>
          </div>
        </div>

        {/* Ticket record */}
        <div className="card p-5">
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 14,
          }}>Ticket Record</p>
          {rows.map(({ label, value, accent, color }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              gap: 10, paddingBottom: 10, marginBottom: 10,
              borderBottom: '1px solid var(--color-border)',
            }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 12, flexShrink: 0, minWidth: 110 }}>{label}</span>
              <span style={{
                fontSize: 13, fontWeight: 700, textAlign: 'right',
                color: color ?? (accent ? 'var(--color-accent)' : 'var(--color-text-primary)'),
              }}>{value}</span>
            </div>
          ))}

          {/* Short description */}
          <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12, display: 'block', marginBottom: 4 }}>Short Description</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
              {ticket.shortDesc}
            </span>
          </div>

          {/* Long description */}
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12, display: 'block', marginBottom: 6 }}>Long Description</span>
            <pre style={{
              fontSize: 11, color: 'var(--color-text-secondary)',
              background: 'var(--color-surface-0)',
              borderRadius: 8, padding: '10px 12px',
              overflowX: 'auto', whiteSpace: 'pre-wrap',
              lineHeight: 1.6, fontFamily: 'monospace',
              maxHeight: 200, overflowY: 'auto',
              margin: 0,
            }}>
              {ticket.longDesc}
            </pre>
          </div>
        </div>

        <button className="btn-secondary" id="btn-restart" onClick={onReset}>
          ← Start Over
        </button>
      </div>
    )
  }

  // ─── Shared label style ───────────────────────────────────────────────────
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--color-text-muted)', marginBottom: 6,
  }

  // ─── Validation + submission screen ──────────────────────────────────────
  return (
    <div className="animate-slide-up flex flex-col gap-4">

      {/* ── Contact card ── */}
      <div className="card p-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>👤</span>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--color-accent)', margin: 0,
          }}>
            Confirm Your Information
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Locked read-only rows ── */}
          {[
            { label: 'Name',          value: lockedInfo.name },
            { label: 'Store #',       value: lockedInfo.store },
            { label: 'Store Address', value: lockedInfo.address },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={labelStyle}>
                {label}
                <span style={{
                  marginLeft: 6, fontSize: 10, fontWeight: 500,
                  color: 'var(--color-text-muted)', letterSpacing: 0,
                  textTransform: 'none', opacity: 0.6,
                }}>
                  🔒
                </span>
              </p>
              <div style={{
                background: 'var(--color-surface-3)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-btn)',
                padding: '14px 16px',
                fontSize: 15, fontWeight: 600,
                color: 'var(--color-text-secondary)',
                letterSpacing: 0,
                userSelect: 'none',
              }}>
                {value || <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>—</span>}
              </div>
            </div>
          ))}

          {/* ── Editable: Primary phone ── */}
          <div>
            <label htmlFor="contact-phone" style={labelStyle}>Phone Number</label>
            <input
              id="contact-phone"
              className="text-input"
              style={{ fontSize: 15, letterSpacing: 0, fontWeight: 500 }}
              type="tel"
              value={phone}
              placeholder="(555) 555-0100"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* ── Divider ── */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--color-text-muted)',
              marginBottom: 14,
            }}>
              Backup Contact
              <span style={{ marginLeft: 8, fontWeight: 400, opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>
                optional
              </span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="contact-backup-name" style={labelStyle}>Backup Name</label>
                <input
                  id="contact-backup-name"
                  className="text-input"
                  style={{ fontSize: 15, letterSpacing: 0, fontWeight: 500 }}
                  type="text"
                  value={backupName}
                  placeholder="Backup contact name"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(e) => setBackupName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="contact-backup-phone" style={labelStyle}>Backup Phone</label>
                <input
                  id="contact-backup-phone"
                  className="text-input"
                  style={{ fontSize: 15, letterSpacing: 0, fontWeight: 500 }}
                  type="tel"
                  value={backupPhone}
                  placeholder="(555) 555-0100"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(e) => setBackupPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Session summary card ── */}
      <div className="card p-5">
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 12,
        }}>
          Diagnostic Summary
        </p>
        {session.breadcrumbs.map((crumb, i) => (
          <div
            key={i}
            style={{
              display: 'flex', gap: 10, paddingBottom: 10, marginBottom: 10,
              borderBottom: i < session.breadcrumbs.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12, minWidth: 88, flexShrink: 0 }}>
              {crumb.nodeTitle}
            </span>
            <span style={{ color: 'var(--color-text-primary)', fontSize: 13, fontWeight: 600 }}>
              {crumb.answer}
            </span>
          </div>
        ))}
        {session.serial_number && (
          <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Serial: </span>
            <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 14 }}>
              {session.serial_number}
            </span>
          </div>
        )}
      </div>

      <button
        className="btn-primary"
        id="btn-submit-ticket"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <span className="animate-pulse-soft">Submitting…</span>
          : '🎫 Submit Support Ticket'
        }
      </button>
      <button className="btn-secondary" id="btn-restart-pre" onClick={onReset}>
        ← Start Over
      </button>
    </div>
  )
}


// ─── Breadcrumb Trail ────────────────────────────────────────────────────────

function BreadcrumbTrail({ breadcrumbs }) {
  if (!breadcrumbs.length) return null
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        padding: '10px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-1)',
      }}
    >
      {breadcrumbs.map((crumb, i) => (
        <span
          key={i}
          style={{
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'var(--color-surface-3)',
            color: 'var(--color-text-muted)',
            fontWeight: 600,
            maxWidth: 140,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={crumb.answer}
        >
          {crumb.answer}
        </span>
      ))}
    </div>
  )
}

// ─── Journey Player ──────────────────────────────────────────────────────────

export function JourneyPlayer({ graph, categoryId, currentUser, onReset }) {
  const category = graph.categories.find((c) => c.id === categoryId)
  const [nodeId, setNodeId] = useState(category.entryNode)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [sessionData, setSessionData] = useState({ category: categoryId })

  const node = graph.nodes[nodeId]

  const advance = useCallback(
    (answerLabel, nextNodeId, extraData = {}) => {
      setBreadcrumbs((prev) => [
        ...prev,
        { nodeId: node.id, nodeTitle: node.title.replace(/[^a-zA-Z ]/g, '').trim().slice(0, 22), answer: answerLabel },
      ])
      setSessionData((prev) => ({ ...prev, ...extraData }))
      setNodeId(nextNodeId)
    },
    [node]
  )

  function handlePhotoCapture(fieldKey, data) {
    setSessionData((prev) => ({ ...prev, [fieldKey]: data }))
  }

  const session = { ...sessionData, breadcrumbs }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          background: 'var(--color-surface-1)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          onClick={onReset}
          id="btn-back-home"
          style={{
            background: 'var(--color-surface-3)',
            border: 'none',
            color: 'var(--color-text-secondary)',
            width: 36,
            height: 36,
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>
        <div>
          <span
            style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            {category.icon} {category.label} Support
          </span>
        </div>
      </div>

      {/* Breadcrumb trail */}
      <BreadcrumbTrail breadcrumbs={breadcrumbs} />

      {/* Node content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 20 }}>
          <h2
            style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.3, marginBottom: 6 }}
          >
            {node.title}
          </h2>
          {node.subtitle && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.55 }}>
              {node.subtitle}
            </p>
          )}
        </div>

        {node.type === 'multiple_choice' && (
          <MultipleChoiceNode node={node} onAnswer={(label, next) => advance(label, next)} />
        )}
        {node.type === 'yes_no' && (
          <YesNoNode node={node} onAnswer={(label, next) => advance(label, next)} />
        )}
        {node.type === 'quick_fix' && (
          <QuickFixNode node={node} onAnswer={(label, next) => advance(label, next)} />
        )}
        {node.type === 'photo_upload' && (
          <PhotoUploadNode
            node={node}
            onPhotoCapture={handlePhotoCapture}
            onNext={(label, next) => advance(label, next)}
          />
        )}
        {node.type === 'text_input' && (
          <TextInputNode node={node} onNext={(label, next, extra) => advance(label, next, extra)} />
        )}
        {node.type === 'multi_field_optional' && (
          <MultiFieldOptionalNode
            node={node}
            onNext={(label, next, extra) => advance(label, next, extra)}
          />
        )}
        {node.type === 'terminal_resolved' && <TerminalResolvedNode />}
        {node.type === 'terminal_submit_ticket' && (
          <TerminalSubmitTicketNode session={session} currentUser={currentUser} onReset={onReset} />
        )}
      </div>
    </div>
  )
}
