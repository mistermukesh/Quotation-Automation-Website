/**
 * KAN Universal Sales Quotation System — Google Sheets Integration (Optimized 2.0)
 */

// All 71 columns mapped in sequence
const HEADERS = [
  "REF", "TimeStamp", "Sales Person", "Sales Email", "Sales Contact",
  "Client Name", "Company Name", "Email", "Contact", "Client Address",
  "Site Address", "GST NO", "ORG TYPE", "Project Type", "Module Size",
  "Screen Width (Ft)", "Screen Height (Ft)", "Total no. of Module/Cabinet",
  "No of Module/Cabinet in Width", "No of Module/Cabinet in Height",
  "Actual Width (MM)", "Actual Height (MM)",
  "Actual Screen Width (FT)", "Actual Screen Height (Ft)", "Total Area (SQFT)",
  "Height From Ground (M)", "Viewing Distance (M)", "Power Point Distance (M)",
  "Control Room Distance (M)", "Cabinet Solution", "Mounting Type", "AMC",
  "Site Visit", "MOM of Site Visit", "Transport", "Site readyness & Civil Work",
  "Installation", "Fabrication / Frame", "Crane", "Scaffolding", "Stablizer",
  "Electrical Wiring & Earthing", "LAN Cable beyond 10 Mtr", "S. N.", "Category",
  "Item", "Brand", "Specificiation", "Description", "Qty", "Unit",
  "Unit Price", "Total", "Subtotal", "GST %", "GST", "Discount",
  "Grand Total", "Terms & Condition", "Remarks 1", "Remarks 2", "Remarks 3", "Remarks 4",
  "Remarks 5", "Remarks 6", "Remarks 7", "Remarks 8", "Remarks 9",
  "Remarks 10", "Docs", "PDF Link", "Drive PDF URL", "Master No", "Revision", "Parent Ref", "Prev Ref", "Revision Notes", "Hide Fields"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "System busy generating another quotation. Please try saving again." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RESPONSE");
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    }

    // Invalidate product catalog cache upon any new save/updates
    try {
      CacheService.getScriptCache().remove("product_catalog");
    } catch(cacheErr) {}

    // Check if sheet is empty and write headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    var startRow = sheet.getLastRow() + 1;
    var numRows = 0;
    var pdfUrl = "";
    var attachmentUrl = "";

    var folder;
    try {
      folder = DriveApp.getFolderById("1ehPhIpUdfULBfn0JGRaakkw875ofK3hN");
    } catch (folderErr) {
      var folders = DriveApp.getFoldersByName("KAN Quotations");
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder("KAN Quotations");
      }
    }

    // Save PDF to Google Drive if present
    var pdfDownloadUrl = "";
    if (data.pdfBase64 && data.filename) {
      try {
        var blob = Utilities.newBlob(Utilities.base64Decode(data.pdfBase64), "application/pdf", data.filename);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        pdfUrl = file.getUrl();
        pdfDownloadUrl = "https://drive.google.com/uc?export=download&id=" + file.getId();
      } catch (driveErr) {
        pdfUrl = "Drive upload failed: " + driveErr.toString();
      }
    }

    // Save Attachment to Google Drive if present
    var attachmentUrls = [];
    if (data.attachments && Array.isArray(data.attachments)) {
      for (var a = 0; a < data.attachments.length; a++) {
        var att = data.attachments[a];
        if (att) {
          if (att.base64 && att.filename) {
            try {
              var mime = att.mimeType || "application/octet-stream";
              var ablob = Utilities.newBlob(Utilities.base64Decode(att.base64), mime, att.filename);
              var afile = folder.createFile(ablob);
              afile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
              attachmentUrls.push("https://drive.google.com/uc?export=download&id=" + afile.getId());
            } catch (attErr) {
              attachmentUrls.push("Attachment " + att.filename + " upload failed: " + attErr.toString());
            }
          } else if (att.driveUrl) {
            attachmentUrls.push(att.driveUrl);
          }
        }
      }
      attachmentUrl = attachmentUrls.join("\n");
    } else if (data.attachmentBase64 && data.attachmentFilename) {
      try {
        var mime = data.attachmentMimeType || "application/octet-stream";
        var ablob = Utilities.newBlob(Utilities.base64Decode(data.attachmentBase64), mime, data.attachmentFilename);
        var afile = folder.createFile(ablob);
        afile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        attachmentUrl = "https://drive.google.com/uc?export=download&id=" + afile.getId();
      } catch (attErr) {
        attachmentUrl = "Attachment upload failed: " + attErr.toString();
      }
    }

    // --- Generation Logic ---
    var generatedQuotationNo = "";
    var generatedMasterNo = data.masterNo;
    var generatedRevision = 1;

    if (data.generateNumber) {
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn() || 78;
      var headerData = sheet.getRange(1, 1, Math.min(10, lastRow), lastCol).getValues();
      var headerRowIdx = 0;
      for (var k = 0; k < headerData.length; k++) {
        if (headerData[k][0] === "REF") {
          headerRowIdx = k;
          break;
        }
      }
      var headersRow = headerData[headerRowIdx] || [];
      var masterNoIdx = headersRow.indexOf("Master No");
      var revisionIdx = headersRow.indexOf("Revision");

      if (masterNoIdx === -1) masterNoIdx = 72;
      if (revisionIdx === -1) revisionIdx = 73;

      var numRowsToRead = lastRow - (headerRowIdx + 1);
      if (numRowsToRead > 0) {
        if (data.isRevision && data.masterNo) {
          // Optimized: Read ONLY target columns instead of entire sheet
          var masterNos = sheet.getRange(headerRowIdx + 2, masterNoIdx + 1, numRowsToRead, 1).getValues();
          var revisions = sheet.getRange(headerRowIdx + 2, revisionIdx + 1, numRowsToRead, 1).getValues();
          
          var maxRev = 0;
          for (var i = 0; i < numRowsToRead; i++) {
            if (masterNos[i][0] == data.masterNo) {
              var rev = parseInt(revisions[i][0], 10);
              if (!isNaN(rev) && rev > maxRev) {
                maxRev = rev;
              }
            }
          }
          generatedMasterNo = data.masterNo;
          generatedRevision = maxRev + 1;
        } else {
          // Optimized: Read ONLY Master No column instead of entire sheet
          var masterNos = sheet.getRange(headerRowIdx + 2, masterNoIdx + 1, numRowsToRead, 1).getValues();
          var maxMaster = 1000;
          for (var i = 0; i < numRowsToRead; i++) {
            var mNo = parseInt(masterNos[i][0], 10);
            if (!isNaN(mNo) && mNo > maxMaster) {
              maxMaster = mNo;
            }
          }
          generatedMasterNo = maxMaster + 1;
          generatedRevision = 1;
        }
      } else {
        generatedMasterNo = data.masterNo || 1001;
        generatedRevision = 1;
      }

      generatedQuotationNo = "QT-" + generatedMasterNo + "-L" + generatedRevision;
      
      if (data.filename && file && pdfDownloadUrl) {
         file.setName(generatedQuotationNo + ".pdf");
      }
    } else {
      generatedQuotationNo = data.quotationNo || (data.rows && data.rows.length > 0 ? data.rows[0][0] : "");
    }

    // Write rows using setValues
    if (data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
      numRows = data.rows.length;
      var paddedRows = [];
      for (var i = 0; i < numRows; i++) {
        var row = data.rows[i] || [];
        while (row.length < HEADERS.length) {
          row.push("");
        }
        if (row.length > HEADERS.length) {
          row = row.slice(0, HEADERS.length);
        }
        
        if (data.generateNumber) {
          row[0] = generatedQuotationNo;
          row[72] = generatedMasterNo;
          row[73] = generatedRevision;
          row[74] = data.parentRef || "";
          row[75] = data.prevRef || "";
          row[76] = data.revisionNotes || "";
        }

        row[69] = attachmentUrl || row[69] || "";
        row[70] = pdfDownloadUrl || row[70] || "";
        row[71] = pdfUrl || row[71] || "";
        paddedRows.push(row);
      }
      sheet.getRange(startRow, 1, numRows, HEADERS.length).setValues(paddedRows);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      pdfUrl: pdfUrl, 
      attachmentUrl: attachmentUrl,
      generatedQuotationNo: generatedQuotationNo || null,
      generatedMasterNo: generatedMasterNo || null,
      generatedRevision: generatedRevision || null
    }))
    .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function triggerAuth() {
  var folder;
  try {
    folder = DriveApp.getFolderById("1ehPhIpUdfULBfn0JGRaakkw875ofK3hN");
  } catch (e) {
    var folders = DriveApp.getFoldersByName("KAN Quotations");
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder("KAN Quotations");
    }
  }
  var dummyFile = folder.createFile("dummy.txt", "dummy content");
  dummyFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  dummyFile.setTrashed(true);
}

function parseDateToMs(val) {
  if (!val) return 0;
  if (val instanceof Date) return val.getTime();
  var s = String(val).trim();
  var indMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[\s,T](\d{2}:\d{2}(?::\d{2})?))?/);
  if (indMatch) {
    var dd = indMatch[1];
    var mm = indMatch[2];
    var yyyy = indMatch[3];
    var time = indMatch[4] || "00:00:00";
    return new Date(yyyy + "-" + mm + "-" + dd + "T" + time).getTime();
  }
  var parsed = Date.parse(s);
  return isNaN(parsed) ? 0 : parsed;
}

function doGet(e) {
  try {
    var id = e.parameter.id;
    var action = e.parameter.action;

    if (action === "getAttachmentUrl" && id) {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RESPONSE");
      if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var lastRow = sheet.getLastRow();
      if (lastRow > 0) {
        // Optimized: Only read ID column A to locate row
        var refs = sheet.getRange(1, 1, lastRow, 1).getValues();
        for (var i = 0; i < refs.length; i++) {
          if (refs[i][0] === id) {
            // Column BR (index 69, column 70)
            var attachmentUrl = sheet.getRange(i + 1, 70).getValue() || "";
            return ContentService.createTextOutput(JSON.stringify({ status: "success", url: attachmentUrl }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "not_found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "getNextNumber") {
      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch(lockErr) {}
      
      try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RESPONSE");
        if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn() || 78;
        
        var headerData = sheet.getRange(1, 1, Math.min(10, lastRow), lastCol).getValues();
        var headerRowIdx = 0;
        for (var k = 0; k < headerData.length; k++) {
          if (headerData[k][0] === "REF") { headerRowIdx = k; break; }
        }
        var headersRow = headerData[headerRowIdx] || [];
        var masterNoIdx = headersRow.indexOf("Master No");
        var revisionIdx = headersRow.indexOf("Revision");
        if (masterNoIdx === -1) masterNoIdx = 72;
        if (revisionIdx === -1) revisionIdx = 73;

        var masterNo = e.parameter.masterNo;
        var nextNo = "";
        var mNo = 1000;
        var rNo = 1;

        var numRowsToRead = lastRow - (headerRowIdx + 1);
        if (numRowsToRead > 0) {
          if (masterNo) {
            masterNo = parseInt(masterNo, 10);
            // Optimized: Read only Master No and Revision columns
            var masterNos = sheet.getRange(headerRowIdx + 2, masterNoIdx + 1, numRowsToRead, 1).getValues();
            var revisions = sheet.getRange(headerRowIdx + 2, revisionIdx + 1, numRowsToRead, 1).getValues();
            var maxRev = 0;
            for (var i = 0; i < numRowsToRead; i++) {
              if (parseInt(masterNos[i][0], 10) === masterNo) {
                var rev = parseInt(revisions[i][0], 10);
                if (!isNaN(rev) && rev > maxRev) maxRev = rev;
              }
            }
            mNo = masterNo;
            rNo = maxRev + 1;
          } else {
            // Optimized: Read only Master No column
            var masterNos = sheet.getRange(headerRowIdx + 2, masterNoIdx + 1, numRowsToRead, 1).getValues();
            var maxMaster = 1000;
            for (var i = 0; i < numRowsToRead; i++) {
              var currentMNo = parseInt(masterNos[i][0], 10);
              if (!isNaN(currentMNo) && currentMNo > maxMaster) maxMaster = currentMNo;
            }
            mNo = maxMaster + 1;
            rNo = 1;
          }
        }
        
        nextNo = "QT-" + mNo + "-L" + rNo;
        return ContentService.createTextOutput(JSON.stringify({ status: "success", nextNo: nextNo, masterNo: mNo, revision: rNo }))
          .setMimeType(ContentService.MimeType.JSON);
      } finally {
        lock.releaseLock();
      }
    }

    if (action === "getAllQuotations") {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("RESPONSE");
      if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      }
      var data = sheet.getDataRange().getValues();
      var headerRowIdx = 0;
      for (var k = 0; k < Math.min(10, data.length); k++) {
        if (data[k][0] === "REF") {
          headerRowIdx = k;
          break;
        }
      }
      
      var headers = data[headerRowIdx];
      var sinceStr = e.parameter.since;
      var sinceMs = sinceStr ? parseInt(sinceStr, 10) : 0;
      
      var result = [];
      for (var i = headerRowIdx + 1; i < data.length; i++) {
        if (sinceMs > 0) {
          var rowTime = parseDateToMs(data[i][1]); // TimeStamp column index 1
          if (rowTime < sinceMs) continue; // Skip old unchanged rows
        }
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          if (headers[j]) {
            obj[headers[j]] = data[i][j];
          }
        }
        result.push(obj);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "getProducts") {
      var cache = CacheService.getScriptCache();
      var cachedData = cache.get("product_catalog");
      if (cachedData) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", data: JSON.parse(cachedData) }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("PRODUCT") || ss.getSheetByName("Product");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "PRODUCT sheet not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var data = sheet.getRange(2, 2, lastRow - 1, 4).getValues();
      
      try {
        cache.put("product_catalog", JSON.stringify(data), 21600); // 6 hours
      } catch(cacheErr) {}

      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput("Invalid parameters")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}