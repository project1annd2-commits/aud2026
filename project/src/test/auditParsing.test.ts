// Test to verify audit data parsing fix
import { database } from '../utils/database';

async function testAuditParsing() {
  console.log('Testing audit data parsing...');
  
  try {
    // Get audits from database
    const audits = await database.getAudits();
    console.log(`Found ${audits.length} audits`);
    
    if (audits.length > 0) {
      const firstAudit = audits[0];
      console.log('First audit versions type:', typeof firstAudit.versions);
      console.log('First audit versions is array:', Array.isArray(firstAudit.versions));
      
      if (Array.isArray(firstAudit.versions) && firstAudit.versions.length > 0) {
        const firstVersion = firstAudit.versions[0];
        console.log('First version keys:', Object.keys(firstVersion));
        console.log('First version responses type:', typeof firstVersion.responses);
        console.log('First version responses is array:', Array.isArray(firstVersion.responses));
        
        // Test that the data structure is correct
        if (typeof firstVersion.id === 'string' && 
            typeof firstVersion.timestamp === 'string' && 
            Array.isArray(firstVersion.responses)) {
          console.log('✅ Audit data parsing test PASSED');
        } else {
          console.log('❌ Audit data parsing test FAILED');
          console.log('Version structure:', firstVersion);
        }
      } else {
        console.log('❌ Audit versions is not a valid array');
      }
    } else {
      console.log('No audits found in database');
    }
    
    // Test infrastructure audits
    const infraAudits = await database.getInfrastructureAudits();
    console.log(`Found ${infraAudits.length} infrastructure audits`);
    
    if (infraAudits.length > 0) {
      const firstInfraAudit = infraAudits[0];
      console.log('First infra audit versions type:', typeof firstInfraAudit.versions);
      console.log('First infra audit versions is array:', Array.isArray(firstInfraAudit.versions));
      
      if (Array.isArray(firstInfraAudit.versions) && firstInfraAudit.versions.length > 0) {
        const firstVersion = firstInfraAudit.versions[0];
        console.log('First infra version keys:', Object.keys(firstVersion));
        
        // Test that the data structure is correct
        if (typeof firstVersion.id === 'string' && 
            typeof firstVersion.timestamp === 'string' && 
            Array.isArray(firstVersion.responses)) {
          console.log('✅ Infrastructure audit data parsing test PASSED');
        } else {
          console.log('❌ Infrastructure audit data parsing test FAILED');
          console.log('Version structure:', firstVersion);
        }
      } else {
        console.log('Infrastructure audit versions is not a valid array');
      }
    }
    
    console.log('Test completed!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testAuditParsing();

export default testAuditParsing;