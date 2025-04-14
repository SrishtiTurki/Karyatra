#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, jsonify
import sqlite3
import os
import json
from datetime import datetime

app = Flask(__name__)

# Function to get data from database
def get_application_data():
    db_path = ".\data\job_applications.db"
    
    if not os.path.exists(db_path):
        return {
            "applications": [],
            "status_counts": {},
            "company_counts": {},
            "total": 0
        }
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all applications
    cursor.execute('''
    SELECT role, company, status, date_received, subject, sender, last_updated, message_id
    FROM job_applications
    ORDER BY date_received DESC
    ''')
    
    applications = [dict(row) for row in cursor.fetchall()]
    
    # Get status counts
    cursor.execute('''
    SELECT status, COUNT(*) as count
    FROM job_applications
    GROUP BY status
    ''')
    
    status_counts = {row['status']: row['count'] for row in cursor.fetchall()}
    
    # Get company counts
    cursor.execute('''
    SELECT company, COUNT(*) as count
    FROM job_applications
    GROUP BY company
    ORDER BY count DESC
    LIMIT 10
    ''')
    
    company_counts = {row['company']: row['count'] for row in cursor.fetchall()}
    
    conn.close()
    
    return {
        "applications": applications,
        "status_counts": status_counts,
        "company_counts": company_counts,
        "total": len(applications)
    }

@app.route('/')
def index():
    """Render the dashboard homepage."""
    return render_template('index.html')

@app.route('/api/applications')
def api_applications():
    """API endpoint to get all application data."""
    data = get_application_data()
    return jsonify(data)

# Create templates directory and index.html template
def create_templates():
    templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
    
    if not os.path.exists(templates_dir):
        os.makedirs(templates_dir)
    
    index_html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Application Tracker</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            padding: 20px;
        }
        .card {
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .card-header {
            background-color: #4a6da7;
            color: white;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            padding: 15px 20px;
            font-weight: 600;
        }
        .table th {
            font-weight: 600;
            color: #495057;
        }
        .stat-card {
            text-align: center;
            padding: 20px;
        }
        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #4a6da7;
        }
        .stat-label {
            font-size: 1rem;
            color: #6c757d;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="my-4 text-center">Job Application Tracker</h1>
        
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card stat-card">
                    <div class="stat-value" id="total-apps">0</div>
                    <div class="stat-label">Total Applications</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card">
                    <div class="stat-value" id="interview-count">0</div>
                    <div class="stat-label">Interviews</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card">
                    <div class="stat-value" id="offer-count">0</div>
                    <div class="stat-label">Offers</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card">
                    <div class="stat-value" id="rejected-count">0</div>
                    <div class="stat-label">Rejections</div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        Status Breakdown
                    </div>
                    <div class="card-body">
                        <canvas id="statusChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        Top Companies
                    </div>
                    <div class="card-body">
                        <canvas id="companyChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <span>All Applications</span>
                <input type="text" id="searchInput" class="form-control" style="max-width: 300px;" placeholder="Search...">
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Role</th>
                                <th>Company</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Go to mail</th>
                            </tr>
                        </thead>
                        <tbody id="applicationsTable">
                            <!-- Data will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Fetch application data from the API
        async function loadApplicationData() {
            const response = await fetch('/api/applications');
            const data = await response.json();
            return data;
        }
        
        // Initialize charts and tables
        async function initializeDashboard() {
            const data = await loadApplicationData();
            
            // Update stats
            document.getElementById('total-apps').textContent = data.total;
            
            let interviewCount = 0;
            let offerCount = 0;
            let rejectedCount = 0;
            
            // Count different status types
            Object.entries(data.status_counts).forEach(([status, count]) => {
                if (status.toLowerCase().includes('interview')) {
                    interviewCount += count;
                }
                if (status.toLowerCase().includes('offer') || status.toLowerCase().includes('selected')) {
                    offerCount += count;
                }
                if (status.toLowerCase().includes('reject')) {
                    rejectedCount += count;
                }
            });
            
            document.getElementById('interview-count').textContent = interviewCount;
            document.getElementById('offer-count').textContent = offerCount;
            document.getElementById('rejected-count').textContent = rejectedCount;
            
            // Status chart
            const statusCtx = document.getElementById('statusChart').getContext('2d');
            const statusLabels = Object.keys(data.status_counts);
            const statusValues = Object.values(data.status_counts);
            
            new Chart(statusCtx, {
                type: 'pie',
                data: {
                    labels: statusLabels,
                    datasets: [{
                        data: statusValues,
                        backgroundColor: [
                            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', 
                            '#e74a3b', '#858796', '#5a5c69', '#6f42c1',
                            '#20c9a6', '#4a6da7'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
            
            // Company chart
            const companyCtx = document.getElementById('companyChart').getContext('2d');
            const companyLabels = Object.keys(data.company_counts);
            const companyValues = Object.values(data.company_counts);
            
            new Chart(companyCtx, {
                type: 'bar',
                data: {
                    labels: companyLabels,
                    datasets: [{
                        label: 'Applications',
                        data: companyValues,
                        backgroundColor: '#4a6da7'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
            
            // Populate table
            const tableBody = document.getElementById('applicationsTable');
            tableBody.innerHTML = '';
            
            data.applications.forEach(app => {
                const row = document.createElement('tr');
                
                // Format date
                let dateStr = app.date_received;
                try {
                    const date = new Date(app.date_received);
                    dateStr = date.toLocaleDateString();
                } catch(e) {
                    // Use original string if date parsing fails
                }
                
                row.innerHTML = `
                    <td>${app.role || 'Unknown'}</td>
                    <td>${app.company || 'Unknown'}</td>
                    <td>${app.status || 'Unknown'}</td>
                    <td>${dateStr}</td>
                    <td><a href="${app.gmail_link}" target="_blank">View Email</a></td> <!-- Gmail link -->
                `;
                
                tableBody.appendChild(row);
            });
            
            // Setup search functionality
            document.getElementById('searchInput').addEventListener('keyup', function() {
                const searchTerm = this.value.toLowerCase();
                const rows = tableBody.getElementsByTagName('tr');
                
                for (let i = 0; i < rows.length; i++) {
                    const rowText = rows[i].textContent.toLowerCase();
                    rows[i].style.display = rowText.includes(searchTerm) ? '' : 'none';
                }
            });
        }
        
        // Initialize the dashboard when the page loads
        window.addEventListener('load', initializeDashboard);
    </script>
</body>
</html>
    """
    
    with open(os.path.join(templates_dir, 'index.html'), 'w') as f:
        f.write(index_html)
    
    print(f"Created templates directory and index.html")

if __name__ == '__main__':
    # Create template files
    create_templates()
    
    print("Starting Job Application Dashboard")
    print("Open http://127.0.0.1:5000 in your browser")
    app.run(debug=True)