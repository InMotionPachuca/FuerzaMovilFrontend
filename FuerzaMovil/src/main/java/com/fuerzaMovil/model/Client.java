package com.fuerzaMovil.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String companyName;

    @Column(nullable = false, length = 100)
    private String contactEmail;

    @Column(length = 20)
    private String contactPhone;

    // Datos sensibles protegidos
    @Column(name = "sensitive_notes", columnDefinition = "TEXT")
    private String sensitiveNotes;

    @Column(name = "tax_id", length = 50)
    private String taxId;

    // Campo Clave: El usuario de la agencia al que está asignado este cliente
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Client() {}

    public Client(String companyName, String contactEmail, String contactPhone, String sensitiveNotes, String taxId, User assignedUser) {
        this.companyName = companyName;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.sensitiveNotes = sensitiveNotes;
        this.taxId = taxId;
        this.assignedUser = assignedUser;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getSensitiveNotes() { return sensitiveNotes; }
    public void setSensitiveNotes(String sensitiveNotes) { this.sensitiveNotes = sensitiveNotes; }

    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }

    public User getAssignedUser() { return assignedUser; }
    public void setAssignedUser(User assignedUser) { this.assignedUser = assignedUser; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}