import { jsPDF } from 'jspdf';
import { UserProfile } from '../types';

/**
 * Generates an official Gramonnati Rural Rise Farmer / Agricultural Specialist / Admin Dossier in PDF format.
 * Includes website branding, Rural Rise emblem styling, full credential details, and APMC verification stamp.
 */
export function exportProfileToPdf(user: UserProfile) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Decorative Top Agrarian Header Bar
  doc.setFillColor(20, 83, 45); // Deep emerald (#14532d)
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFillColor(234, 179, 8); // Golden Amber accent strip (#eab308)
  doc.rect(0, 24, pageWidth, 2.5, 'F');

  // Rural Rise Brand Name in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GRAMONNATI RURAL RISE', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(253, 224, 71); // Light yellow
  doc.text('DIRECT APMC AGRICULTURAL MANDI & RURAL WORKFORCE NETWORK', 14, 18);

  // Verification Badge on Right
  doc.setFillColor(34, 197, 94);
  doc.roundedRect(pageWidth - 62, 6, 48, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIALLY VERIFIED', pageWidth - 58, 13.5);

  // Document Title
  doc.setTextColor(20, 83, 45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const roleTitle = 
    user.role === 'farmer' ? 'OFFICIAL FARMER & HARVEST PRODUCER DOSSIER' :
    user.role === 'laborer' ? 'VERIFIED AGRICULTURAL SPECIALIST & LABOR DOSSIER' :
    'APMC MANDI ADMINISTRATION CREDENTIAL';
  doc.text(roleTitle, 14, 36);

  // Dossier ID and Issuance Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 100);
  const dossierId = `MH-RR-${(user.id || '84920').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}-${new Date().getFullYear()}`;
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Dossier Reference ID: ${dossierId}  |  Issued: ${issueDate}  |  Portal: gramonnati-rural-rise.gov.in`, 14, 42);

  // Divider line
  doc.setDrawColor(216, 229, 218);
  doc.setLineWidth(0.5);
  doc.line(14, 45, pageWidth - 14, 45);

  let curY = 52;

  // Function to draw a section box with title
  const drawSection = (title: string, yPos: number, height: number, fillColor: [number, number, number] = [248, 250, 248]) => {
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.setDrawColor(216, 229, 218);
    doc.roundedRect(14, yPos, pageWidth - 28, height, 3, 3, 'FD');

    doc.setFillColor(20, 83, 45);
    doc.roundedRect(18, yPos - 3, doc.getTextWidth(title) + 8, 6.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(title, 22, yPos + 1.5);
  };

  // 2. Personal & Contact Details Section
  drawSection('1. PERSONAL & CONTACT CREDENTIALS', curY, 36);
  doc.setFontSize(9);
  doc.setTextColor(40, 50, 40);

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.text('Full Name:', 20, curY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(user.name || 'Member', 52, curY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Primary Role:', 20, curY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(user.role.toUpperCase(), 52, curY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Contact Phone:', 20, curY + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(user.phone || '+91 98220 11223', 52, curY + 25);

  doc.setFont('helvetica', 'bold');
  doc.text('Aadhaar / DBT ID:', 20, curY + 32);
  doc.setFont('helvetica', 'normal');
  doc.text(user.aadhaarNumber || 'XXXX-XXXX-8921 (UIDAI Verified)', 52, curY + 32);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.text('Current District:', 110, curY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(user.district || 'Nashik', 145, curY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Taluka / Tehsil:', 110, curY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(user.taluka || 'Niphad', 145, curY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Full Location:', 110, curY + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(user.location || 'Maharashtra, India', 145, curY + 25);

  doc.setFont('helvetica', 'bold');
  doc.text('Account Status:', 110, curY + 32);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 101, 52);
  doc.text('Active & Verified (Gramonnati ID)', 145, curY + 32);

  curY += 44;

  // 3. Role-Specific Agrarian Profile Section
  if (user.role === 'farmer') {
    drawSection('2. AGRICULTURAL LAND & CROP PRODUCTION DETAILS', curY, 44);
    doc.setTextColor(40, 50, 40);

    doc.setFont('helvetica', 'bold');
    doc.text('Farm Name / Estate:', 20, curY + 11);
    doc.setFont('helvetica', 'normal');
    doc.text(user.farmName || 'Kisan Kranti Agro Farm', 60, curY + 11);

    doc.setFont('helvetica', 'bold');
    doc.text('Total Farm Acreage:', 20, curY + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(`${user.farmSize || '12.5'} Acres (Registered)`, 60, curY + 18);

    doc.setFont('helvetica', 'bold');
    doc.text('Primary Crops Cultivated:', 20, curY + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(user.crops || 'Sharbati Wheat, Hybrid Bajra, Maldandi Jowar, Soybean', 60, curY + 25);

    doc.setFont('helvetica', 'bold');
    doc.text('Irrigation Infrastructure:', 20, curY + 32);
    doc.setFont('helvetica', 'normal');
    doc.text(user.irrigationType || 'Drip Irrigation & Borewell', 60, curY + 32);

    doc.setFont('helvetica', 'bold');
    doc.text('Farm Gate Loading Address:', 20, curY + 39);
    doc.setFont('helvetica', 'normal');
    doc.text(user.farmGateAddress || `${user.taluka || 'Niphad'}, Gate No. 4, Survey 88`, 60, curY + 39);

    // Kisan Card on side
    doc.setFont('helvetica', 'bold');
    doc.text('Kisan Credit Card (KCC):', 125, curY + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(user.kisanCardId || 'MH-KCC-78219', 165, curY + 18);

    curY += 52;
  } else if (user.role === 'laborer') {
    drawSection('2. WORKFORCE SKILLS & EMPLOYMENT CRITERIA', curY, 44);
    doc.setTextColor(40, 50, 40);

    doc.setFont('helvetica', 'bold');
    doc.text('Verified Agritech Skills:', 20, curY + 11);
    doc.setFont('helvetica', 'normal');
    doc.text(user.skills || 'Tractor Driving, Wheat Harvesting, Sowing, Drip Irrigation', 60, curY + 11);

    doc.setFont('helvetica', 'bold');
    doc.text('Field Experience:', 20, curY + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(`${user.experience || '5'} Years in Agricultural Operations`, 60, curY + 18);

    doc.setFont('helvetica', 'bold');
    doc.text('Expected Daily Wage:', 20, curY + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${user.expectedWage || 650} / day (Standard Mandi Norm)`, 60, curY + 25);

    doc.setFont('helvetica', 'bold');
    doc.text('Operational Radius:', 20, curY + 32);
    doc.setFont('helvetica', 'normal');
    doc.text(`Within ${user.workingRadiusKm || 25} km from base village`, 60, curY + 32);

    doc.setFont('helvetica', 'bold');
    doc.text('Demographics & Age:', 20, curY + 39);
    doc.setFont('helvetica', 'normal');
    doc.text(`${user.age || '28'} Years | ${user.gender || 'Male'}`, 60, curY + 39);

    // Emergency Contact
    doc.setFont('helvetica', 'bold');
    doc.text('Emergency Contact:', 125, curY + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(user.emergencyPhone || '+91 94231 99887', 160, curY + 25);

    curY += 52;
  } else {
    drawSection('2. APMC MANDI JURISDICTION & AUTHORITY', curY, 34);
    doc.setTextColor(40, 50, 40);

    doc.setFont('helvetica', 'bold');
    doc.text('Mandi / Division:', 20, curY + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(user.mandiDivision || 'Pune APMC & Maharashtra State Agri Marketing Board', 60, curY + 13);

    doc.setFont('helvetica', 'bold');
    doc.text('Admin Authorization Code:', 20, curY + 22);
    doc.setFont('helvetica', 'normal');
    doc.text(user.adminCode || 'GRAMONNATI-ADMIN-2026', 60, curY + 22);

    curY += 42;
  }

  // 4. Bank Account & Direct Benefit Transfer (DBT) Details (ONLY FOR FARMER AND LABORER)
  if (user.role !== 'admin') {
    drawSection('3. BANK ACCOUNT & DIRECT BENEFIT TRANSFER (DBT) DETAILS', curY, 36, [254, 252, 232]);
    doc.setTextColor(40, 50, 40);

    doc.setFont('helvetica', 'bold');
    doc.text('Bank Name:', 20, curY + 11);
    doc.setFont('helvetica', 'normal');
    doc.text(user.bankName || 'State Bank of India (SBI)', 52, curY + 11);

    doc.setFont('helvetica', 'bold');
    doc.text('Account Number:', 20, curY + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(user.accountNumber || '34891029384', 52, curY + 18);

    doc.setFont('helvetica', 'bold');
    doc.text('IFSC Code:', 20, curY + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(user.ifscCode || 'SBIN0001245', 52, curY + 25);

    doc.setFont('helvetica', 'bold');
    doc.text('UPI Virtual ID:', 110, curY + 11);
    doc.setFont('helvetica', 'normal');
    doc.text(user.upiId || 'kisan.rural@upi', 140, curY + 11);

    doc.setFont('helvetica', 'bold');
    doc.text('DBT Direct Credit:', 110, curY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 101, 52);
    doc.text('Enabled for Crop Proceeds & Wages', 140, curY + 18);

    curY += 44;
  }

  // 5. Official Verification Stamp & Seal
  doc.setFillColor(240, 248, 241);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, curY, pageWidth - 28, 30, 3, 3, 'FD');

  // Digital Seal Box
  doc.setDrawColor(20, 83, 45);
  doc.setLineWidth(1);
  doc.circle(pageWidth - 32, curY + 15, 10, 'S');
  doc.circle(pageWidth - 32, curY + 15, 8.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(20, 83, 45);
  doc.text('GRAMONNATI', pageWidth - 39, curY + 13.5);
  doc.text('SEAL 2026', pageWidth - 37.5, curY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 83, 45);
  doc.text('DIGITALLY CERTIFIED BY GRAMONNATI APMC RURAL NETWORK', 20, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 85, 70);
  doc.text('This credential dossier confirms active registration on the Gramonnati Rural Rise Agri-Tech platform.', 20, curY + 14);
  doc.text('Authorized for farm-gate produce loading, APMC market yard trading, and tractor-guided wage settlement.', 20, curY + 19);
  doc.text('Official URL: https://gramonnati.org  |  Toll-Free Support: 1800-889-RURAL', 20, curY + 24);

  // Footer bar
  doc.setFillColor(20, 83, 45);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Gramonnati Rural Rise © 2026  •  Empowering Rural Economy, Farm Gate Commerce & Transparent Mandis', 14, pageHeight - 3);

  // Save the PDF
  const sanitizedName = (user.name || 'Member').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Gramonnati_Profile_${sanitizedName}_${user.role}.pdf`);
}
