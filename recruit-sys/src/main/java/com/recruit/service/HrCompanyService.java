package com.recruit.service;

import com.recruit.model.CompanyDO;
import com.recruit.model.HrCompanyDO;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 * <p>
 *  服务类
 * </p>
 *
 * @author kate

 * 


 */
public interface HrCompanyService extends IService<HrCompanyDO> {

    CompanyDO getCompany(Integer hrID);

    boolean create(Integer hrID, Integer companyID);

    HrCompanyDO getByHrId(Integer hrID);
}
