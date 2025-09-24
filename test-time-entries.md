# Time Entry API Testing Examples

## 🚀 **Simplified Time Entry Controller - Test Examples**

### **1. Get All Time Entries**
```
GET /api/time-entries
Authorization: Bearer YOUR_TOKEN
```

### **2. Get Time Entries for Specific Task**
```
GET /api/time-entries?taskId=task-uuid-here
Authorization: Bearer YOUR_TOKEN
```

### **3. Get Time Entries for Specific Project**
```
GET /api/time-entries?projectId=project-uuid-here
Authorization: Bearer YOUR_TOKEN
```

### **4. Get Time Entries for Specific User (Managers only)**
```
GET /api/time-entries?userId=user-uuid-here
Authorization: Bearer YOUR_TOKEN
```

### **5. Get Time Entries by Date Range**
```
GET /api/time-entries?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z
Authorization: Bearer YOUR_TOKEN
```

### **6. Get Only Billable Time Entries**
```
GET /api/time-entries?billable=true
Authorization: Bearer YOUR_TOKEN
```

### **7. Get Non-Billable Time Entries**
```
GET /api/time-entries?billable=false
Authorization: Bearer YOUR_TOKEN
```

### **8. Combined Filters**
```
GET /api/time-entries?projectId=project-123&billable=true&startDate=2024-01-01T00:00:00Z
Authorization: Bearer YOUR_TOKEN
```

## 📊 **Response Format**

```json
{
  "success": true,
  "message": "Time entries retrieved successfully",
  "data": [
    {
      "id": "time-entry-uuid",
      "taskId": "task-uuid",
      "userId": "user-uuid",
      "startedAt": "2024-01-15T09:00:00Z",
      "endedAt": "2024-01-15T11:30:00Z",
      "minutes": 150,
      "billable": true,
      "note": "Fixed login bug",
      "task": {
        "id": "task-uuid",
        "title": "Fix Login Bug",
        "projectId": "project-uuid",
        "project": {
          "id": "project-uuid",
          "name": "Website Redesign",
          "orgId": "org-uuid"
        }
      },
      "user": {
        "id": "user-uuid",
        "username": "john_doe",
        "email": "john@example.com"
      }
    }
  ],
  "summary": {
    "totalEntries": 5,
    "totalMinutes": 750,
    "totalHours": 12.5,
    "billableMinutes": 600,
    "billableHours": 10.0
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 **How the Simplified Filtering Works**

### **Step 1: Get All Data**
```javascript
let timeEntries = await prisma.timeEntry.findMany({...});
```

### **Step 2: Apply Filters One by One**
```javascript
// Security: Only current organization
timeEntries = timeEntries.filter(entry => 
  entry.task.project.orgId === organizationId
);

// Permissions: Only current user (or specified user if manager)
if (targetUserId) {
  timeEntries = timeEntries.filter(entry => entry.userId === targetUserId);
}

// Task filter
if (taskId) {
  timeEntries = timeEntries.filter(entry => entry.taskId === taskId);
}

// Project filter
if (projectId) {
  timeEntries = timeEntries.filter(entry => entry.task.projectId === projectId);
}

// Date filters
if (startDate) {
  const start = new Date(startDate);
  timeEntries = timeEntries.filter(entry => entry.startedAt >= start);
}

if (endDate) {
  const end = new Date(endDate);
  timeEntries = timeEntries.filter(entry => entry.startedAt <= end);
}

// Billable filter
if (billable !== undefined) {
  const isBillable = billable === 'true';
  timeEntries = timeEntries.filter(entry => entry.billable === isBillable);
}
```

## ✅ **Benefits of This Approach**

1. **Easy to Understand**: Each filter is a simple `if` statement
2. **Easy to Debug**: You can see exactly what's being filtered
3. **Easy to Modify**: Add new filters easily
4. **Easy to Test**: Test each filter separately
5. **No Complex Database Queries**: Simple JavaScript filtering

## 🎯 **Next Steps**

1. **Run Migration**: `npx prisma migrate dev --name add_time_entry_model`
2. **Test the Endpoints**: Use the examples above
3. **Build Frontend**: Create UI to interact with these APIs

The simplified approach makes it much easier to understand and maintain! 🚀
