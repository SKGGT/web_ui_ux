describe("Forum full-stack test", () => {
  it("registers, logs out, logs back in, exercises discussion flows, and deletes the user with content", () => {
    const timestamp = Date.now();
    const name = "Cypress User";
    const email = `cypress.user.${timestamp}@example.com`;
    const password = "supersecret";
    const discussion_name = "Cypress test thread";
    const discussion_comment = "Cypress test comment text";

    cy.visit("/register");

    cy.get('input[placeholder="Name"]').type(name);
    cy.get('input[placeholder="Email"]').type(email);
    cy.get("select").select("Female");
    cy.get('input[type="date"]').type("1995-07-04");
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains("button", "Register").click();

    cy.url().should("include", "/discussions");
    cy.contains("Create Discussion").should("be.visible");
    cy.contains(discussion_name).should("not.exist");

    cy.contains("button", "Logout").click();
    cy.contains("Login").should("be.visible");

    cy.visit("/login");
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains("button", "Login").click();

    cy.url().should("include", "/discussions");
    cy.get('input[placeholder="Title"]').type(discussion_name);
    cy.get('textarea[placeholder="First comment"]').type(discussion_comment);
    cy.contains("button", "Create").click();

    cy.url().should("match", /\/discussions\/[0-9a-f-]+$/);
    cy.contains("h1", discussion_name).should("be.visible");
    cy.contains(`Created by: ${name}`).should("be.visible");
    cy.contains(discussion_comment).should("be.visible");
    cy.contains(/Comments:\s*1/).should("be.visible");

    const extra_commnet = "Extra comment"

    cy.get("textarea").type(extra_commnet);
    cy.contains("button", "Post Comment").click();

    cy.contains(extra_commnet).should("be.visible");
    cy.contains(/Comments:\s*2/).should("be.visible");

    cy.contains("button", "Close Discussion").click();
    cy.contains("This discussion is closed.").should("be.visible");
    cy.contains("button", "Reopen Discussion").should("be.visible");

    cy.contains("button", "Delete Discussion").click();
    cy.url().should("include", "/discussions");
    cy.contains(discussion_name).should("not.exist");

    const anon_discussion_name = "Cypress anon test thread";
    const anon_discussion_comment = "Cypress anon test comment text";

    cy.get('input[placeholder="Title"]').type(anon_discussion_name);
    cy.get('textarea[placeholder="First comment"]').type(anon_discussion_comment);
    cy.get('input[type="checkbox"]').check();
    cy.contains("button", "Create").click();

    cy.url().should("match", /\/discussions\/[0-9a-f-]+$/);
    cy.contains("h1", anon_discussion_name).should("be.visible");
    cy.contains("Created by: Anonymous").should("be.visible");
    cy.contains(anon_discussion_comment).should("be.visible");
    cy.contains("button", "Close Discussion").should("not.exist");
    cy.contains("button", "Delete Discussion").should("not.exist");

    cy.contains("Profile").click();
    cy.contains("Delete Account").should("be.visible");
    cy.contains("button", "Delete Account + Content").click();

    cy.url().should("include", "/login");
    cy.contains("button", "Login").should("be.visible");

    cy.visit("/discussions");
    cy.contains(anon_discussion_name).should("not.exist");

    cy.visit("/login");
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
    cy.contains("button", "Login").click();
    cy.contains("Invalid email or password.").should("be.visible");
  });
});
