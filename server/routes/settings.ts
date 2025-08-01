import { Router } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from '../index.js';
import { AuditableRequest } from '../middleware/auditMiddleware.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

interface SettingRecord extends RowDataPacket {
  setting_id: number;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'object';
  category: string;
  description: string;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

// GET all settings or by category
router.get('/', async (req: AuditableRequest, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM app_settings';
    const params: any[] = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY category, setting_key';
    
    const [settings] = await db.execute<SettingRecord[]>(query, params);
    
    // Parse JSON values for easier frontend consumption
    const parsedSettings = settings.map(setting => ({
      ...setting,
      setting_value: setting.setting_type === 'json' || setting.setting_type === 'object' 
        ? JSON.parse(setting.setting_value) 
        : setting.setting_value
    }));
    
    res.json(parsedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET specific setting by key
router.get('/:key', async (req: AuditableRequest, res) => {
  try {
    const { key } = req.params;
    
    const query = 'SELECT * FROM app_settings WHERE setting_key = ?';
    const [settings] = await db.execute<SettingRecord[]>(query, [key]);
    
    if (settings.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    const setting = settings[0];
    
    // Parse JSON value if applicable
    const parsedSetting = {
      ...setting,
      setting_value: setting.setting_type === 'json' || setting.setting_type === 'object'
        ? JSON.parse(setting.setting_value)
        : setting.setting_value
    };
    
    res.json(parsedSetting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// PUT update setting (requires admin role)
router.put('/:key', requireRole(['admin']), async (req: AuditableRequest, res) => {
  try {
    const { key } = req.params;
    const { setting_value, description } = req.body;
    
    // Check if setting exists and if it's system setting
    const checkQuery = 'SELECT * FROM app_settings WHERE setting_key = ?';
    const [existingSettings] = await db.execute<SettingRecord[]>(checkQuery, [key]);
    
    if (existingSettings.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    const existingSetting = existingSettings[0];
    
    if (existingSetting.is_system) {
      return res.status(403).json({ error: 'Cannot modify system settings' });
    }
    
    // Prepare the value based on setting type
    let processedValue = setting_value;
    if (existingSetting.setting_type === 'json' || existingSetting.setting_type === 'object') {
      processedValue = JSON.stringify(setting_value);
    }
    
    // Update the setting
    const updateQuery = `
      UPDATE app_settings 
      SET setting_value = ?, description = COALESCE(?, description), updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ?
    `;
    
    const [result] = await db.execute<ResultSetHeader>(
      updateQuery, 
      [processedValue, description, req.user?.username || 'system', key]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    // Fetch updated setting
    const [updatedSettings] = await db.execute<SettingRecord[]>(checkQuery, [key]);
    const updatedSetting = updatedSettings[0];
    
    const parsedSetting = {
      ...updatedSetting,
      setting_value: updatedSetting.setting_type === 'json' || updatedSetting.setting_type === 'object'
        ? JSON.parse(updatedSetting.setting_value)
        : updatedSetting.setting_value
    };
    
    res.json({
      message: 'Setting updated successfully',
      setting: parsedSetting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// POST create new setting (requires admin role)
router.post('/', requireRole(['admin']), async (req: AuditableRequest, res) => {
  try {
    const { 
      setting_key, 
      setting_value, 
      setting_type = 'string', 
      category, 
      description,
      is_system = false 
    } = req.body;
    
    if (!setting_key || !category) {
      return res.status(400).json({ error: 'setting_key and category are required' });
    }
    
    // Check if setting already exists
    const checkQuery = 'SELECT setting_id FROM app_settings WHERE setting_key = ?';
    const [existing] = await db.execute<RowDataPacket[]>(checkQuery, [setting_key]);
    
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Setting with this key already exists' });
    }
    
    // Prepare the value based on setting type
    let processedValue = setting_value;
    if (setting_type === 'json' || setting_type === 'object') {
      processedValue = JSON.stringify(setting_value);
    }
    
    const insertQuery = `
      INSERT INTO app_settings (setting_key, setting_value, setting_type, category, description, is_system, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute<ResultSetHeader>(insertQuery, [
      setting_key,
      processedValue,
      setting_type,
      category,
      description,
      is_system,
      req.user?.username || 'system'
    ]);
    
    // Fetch the created setting
    const [newSettings] = await db.execute<SettingRecord[]>(
      'SELECT * FROM app_settings WHERE setting_id = ?', 
      [result.insertId]
    );
    
    const newSetting = newSettings[0];
    const parsedSetting = {
      ...newSetting,
      setting_value: newSetting.setting_type === 'json' || newSetting.setting_type === 'object'
        ? JSON.parse(newSetting.setting_value)
        : newSetting.setting_value
    };
    
    res.status(201).json({
      message: 'Setting created successfully',
      setting: parsedSetting
    });
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
});

// DELETE setting (requires admin role, cannot delete system settings)
router.delete('/:key', requireRole(['admin']), async (req: AuditableRequest, res) => {
  try {
    const { key } = req.params;
    
    // Check if setting exists and if it's system setting
    const checkQuery = 'SELECT is_system FROM app_settings WHERE setting_key = ?';
    const [settings] = await db.execute<RowDataPacket[]>(checkQuery, [key]);
    
    if (settings.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    if (settings[0].is_system) {
      return res.status(403).json({ error: 'Cannot delete system settings' });
    }
    
    const deleteQuery = 'DELETE FROM app_settings WHERE setting_key = ?';
    const [result] = await db.execute<ResultSetHeader>(deleteQuery, [key]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// GET all categories
router.get('/categories/list', async (req: AuditableRequest, res) => {
  try {
    const query = 'SELECT DISTINCT category FROM app_settings ORDER BY category';
    const [categories] = await db.execute<RowDataPacket[]>(query);
    
    res.json(categories.map(row => row.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;