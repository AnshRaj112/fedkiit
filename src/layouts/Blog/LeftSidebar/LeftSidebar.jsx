"use client";

import React from 'react';
import styles from './styles/LeftSidebar.module.scss';
import Input from '../../../components/Core/Input'; 

function LeftSidebar({
  selectedDepartment,
  onSelectDepartment,
  sortOrder,
  onSortOrderChange,
  searchQuery,
  onSearchChange
}) {
  //departments function
  const departments = [
    "All Departments",
    "Technical",
    "Creative",
    "Marketing",
    "Operations",
    "PR And Finance",
    "Human Resource",
  ];
  
  const sortOptions = [
    { label: "Latest", value: "latest" },
    { label: "Oldest", value: "oldest" },
  ];

  return (
    <div className={styles.leftSidebar}>
     
      <div className={styles.searchBar}>
        <h3 className={styles.subtitle}>Search</h3>
        <br></br>
        <input
          type="text"
          placeholder="Search blogs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
     
      <div className={styles.filterSection}>
        <h3 className={styles.subtitle}>Sort By</h3>
        <div className={styles.departmentSelect}>
          <Input
            type="select"
            name="sortOrder"
            value={sortOrder || "latest"}
            placeholder="Latest"
            onChange={(value) => onSortOrderChange(value)}
            options={sortOptions}
          />
        </div>
      </div>
          
   {/* filtering + dropdowndepartment */}
      <div className={styles.filterSection}>
        <h3 className={styles.subtitle}>Departments</h3>
        <div className={styles.departmentSelect}>
          <Input
            type="select"
            name="departments"
            value={selectedDepartment || ""}
            placeholder="All Departments"
            onChange={(value) =>
              onSelectDepartment(value === "All Departments" ? null : value)
            }
            options={departments.map((dept) => ({ label: dept, value: dept }))}
          />
        </div>
      </div>
    </div>
  );
}

export default LeftSidebar;